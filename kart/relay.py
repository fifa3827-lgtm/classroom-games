#!/usr/bin/env python3
"""스피드 레이싱 그랑프리 중계 장치.

큰 화면(호스트)과 휴대폰(플레이어)의 메시지를 이어 줍니다.
파이썬 기본 기능만 써서 따로 설치할 것이 없어요.

  집·학교 PC에서 시험할 때:   python relay.py            (게임 파일도 함께 보여 줌, http://localhost:8080)
  달빛 오락실 서버에서:       python3 relay.py --host 127.0.0.1 --port 8765 --no-static
"""
import argparse
import asyncio
import base64
import hashlib
import json
import mimetypes
import os
import random
import secrets
import struct
import time
from urllib.parse import urlparse, unquote

HERE = os.path.dirname(os.path.abspath(__file__))
WS_PATH = '/kart-ws'
GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
MAX_MSG = 64 * 1024
MAX_PLAYERS = 16          # 실제 자리 수(8)는 큰 화면이 정해요
ROOM_TTL = 30 * 60        # 큰 화면이 떠나고 30분이 지나면 방을 닫아요

rooms = {}                # 방 번호 → Room


class Conn:
    def __init__(self, reader, writer):
        self.r, self.w = reader, writer
        self.room = None
        self.pid = None
        self.is_host = False
        self.info = None
        self.closed = False

    def send(self, obj):
        if self.closed:
            return
        data = json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode()
        self.send_frame(0x1, data)

    def send_frame(self, op, data):
        if self.closed:
            return
        n = len(data)
        hdr = bytearray([0x80 | op])
        if n < 126:
            hdr.append(n)
        elif n < 65536:
            hdr.append(126)
            hdr += struct.pack('>H', n)
        else:
            hdr.append(127)
            hdr += struct.pack('>Q', n)
        try:
            # 느린 기기 하나 때문에 모두가 기다리지 않도록 drain 없이 보내고, 너무 밀리면 끊어요
            if self.w.transport.get_write_buffer_size() > 512 * 1024:
                self.close()
                return
            self.w.write(bytes(hdr) + data)
        except Exception:
            self.closed = True

    def close(self):
        if not self.closed:
            self.closed = True
            try:
                self.w.close()
            except Exception:
                pass


class Room:
    def __init__(self, code):
        self.code = code
        self.key = secrets.token_hex(8)
        self.host = None
        self.players = {}     # pid → Conn
        self.next_pid = 1
        self.host_gone_at = None


def new_code():
    for _ in range(1000):
        code = '%04d' % random.randint(1000, 9999)
        if code not in rooms:
            return code
    raise RuntimeError('방 번호가 모자라요')


# ── 메시지 처리 ────────────────────────────────────────────

def on_message(c, msg):
    t = msg.get('t')
    if c.is_host:
        room = c.room
        if t == 'to':
            p = room.players.get(msg.get('pid'))
            if p:
                p.send({'t': 'd', 'd': msg.get('d')})
        elif t == 'all':
            out = {'t': 'd', 'd': msg.get('d')}
            for p in list(room.players.values()):
                p.send(out)
        elif t == 'kick':
            p = room.players.get(msg.get('pid'))
            if p:
                p.send({'t': 'kicked'})
                p.close()
        return

    if c.room is not None:
        if t == 'm':
            h = c.room.host
            if h:
                h.send({'t': 'm', 'pid': c.pid, 'd': msg.get('d')})
        return

    # 아직 방에 들어가지 않은 연결
    if t == 'host':
        code, key = str(msg.get('code') or ''), msg.get('key')
        room = rooms.get(code)
        if room and room.key == key:
            # 새로 고침한 큰 화면이 같은 방을 다시 잡음
            if room.host and room.host is not c:
                room.host.send({'t': 'replaced'})
                room.host.close()
        else:
            room = Room(new_code())
            rooms[room.code] = room
        room.host = c
        room.host_gone_at = None
        c.room, c.is_host = room, True
        c.send({'t': 'room', 'code': room.code, 'key': room.key})
        for p in room.players.values():
            c.send({'t': 'join', 'pid': p.pid, 'info': p.info})
            p.send({'t': 'hostback'})
    elif t == 'join':
        room = rooms.get(str(msg.get('code') or ''))
        if not room:
            c.send({'t': 'noroom'})
            return
        if len(room.players) >= MAX_PLAYERS:
            c.send({'t': 'full'})
            return
        info = msg.get('info') or {}
        # 같은 기기가 다시 들어오면 예전 연결은 닫아요
        for p in list(room.players.values()):
            if info.get('id') and p.info and p.info.get('id') == info.get('id'):
                drop_player(p)
                p.close()
        c.pid = room.next_pid
        room.next_pid += 1
        c.room, c.info = room, info
        room.players[c.pid] = c
        c.send({'t': 'joined', 'pid': c.pid, 'host': room.host is not None})
        if room.host:
            room.host.send({'t': 'join', 'pid': c.pid, 'info': info})


def drop_player(c):
    room = c.room
    if room and room.players.get(c.pid) is c:
        del room.players[c.pid]
        if room.host:
            room.host.send({'t': 'leave', 'pid': c.pid})


def on_close(c):
    room = c.room
    if not room:
        return
    if c.is_host:
        if room.host is c:
            room.host = None
            room.host_gone_at = time.time()
            for p in room.players.values():
                p.send({'t': 'hostgone'})
    else:
        drop_player(c)


async def cleanup():
    while True:
        await asyncio.sleep(60)
        now = time.time()
        for code, room in list(rooms.items()):
            if room.host is None and room.host_gone_at and now - room.host_gone_at > ROOM_TTL:
                for p in list(room.players.values()):
                    p.send({'t': 'noroom'})
                    p.close()
                del rooms[code]


# ── 웹소켓 ────────────────────────────────────────────────

async def read_frame(r):
    h = await r.readexactly(2)
    fin, op = h[0] & 0x80, h[0] & 0x0F
    masked, n = h[1] & 0x80, h[1] & 0x7F
    if n == 126:
        n = struct.unpack('>H', await r.readexactly(2))[0]
    elif n == 127:
        n = struct.unpack('>Q', await r.readexactly(8))[0]
    if n > MAX_MSG:
        raise ValueError('너무 큰 메시지')
    mask = await r.readexactly(4) if masked else None
    data = await r.readexactly(n)
    if mask:
        m = int.from_bytes((mask * (n // 4 + 1))[:n], 'big')
        data = (int.from_bytes(data, 'big') ^ m).to_bytes(n, 'big')
    return fin, op, data


async def ws_session(reader, writer, headers):
    key = headers.get('sec-websocket-key', '')
    accept = base64.b64encode(hashlib.sha1((key + GUID).encode()).digest()).decode()
    writer.write((
        'HTTP/1.1 101 Switching Protocols\r\n'
        'Upgrade: websocket\r\nConnection: Upgrade\r\n'
        'Sec-WebSocket-Accept: %s\r\n\r\n' % accept).encode())
    c = Conn(reader, writer)
    buf = b''
    try:
        while not c.closed:
            fin, op, data = await asyncio.wait_for(read_frame(reader), timeout=60)
            if op == 0x8:                       # 닫기
                c.send_frame(0x8, data[:2])
                break
            if op == 0x9:                       # 핑 → 퐁
                c.send_frame(0xA, data)
                continue
            if op == 0xA:
                continue
            if op in (0x1, 0x0):
                buf += data
                if len(buf) > MAX_MSG:
                    break
                if fin:
                    text, buf = buf, b''
                    try:
                        msg = json.loads(text.decode('utf-8'))
                    except Exception:
                        continue
                    if isinstance(msg, dict):
                        on_message(c, msg)
    except (asyncio.IncompleteReadError, asyncio.TimeoutError, ConnectionError, ValueError):
        pass
    finally:
        on_close(c)
        c.close()


# ── 시험용 정적 파일 ───────────────────────────────────────

async def serve_static(writer, path):
    rel = unquote(path).lstrip('/') or 'index.html'
    full = os.path.realpath(os.path.join(HERE, rel))
    if not (full == HERE or full.startswith(HERE + os.sep)) or not os.path.isfile(full):
        body = '없는 파일이에요'.encode()
        writer.write(b'HTTP/1.1 404 Not Found\r\nContent-Type: text/plain; charset=utf-8\r\n'
                     b'Content-Length: %d\r\nConnection: close\r\n\r\n' % len(body) + body)
        return
    ctype = mimetypes.guess_type(full)[0] or 'application/octet-stream'
    if full.endswith('.js'):
        ctype = 'text/javascript'
    if ctype.startswith('text/') or ctype.endswith('javascript'):
        ctype += '; charset=utf-8'
    with open(full, 'rb') as f:
        body = f.read()
    writer.write(('HTTP/1.1 200 OK\r\nContent-Type: %s\r\nContent-Length: %d\r\n'
                  'Cache-Control: no-store\r\nConnection: close\r\n\r\n' % (ctype, len(body))).encode() + body)


def make_handler(static):
    async def handle(reader, writer):
        try:
            req = await asyncio.wait_for(reader.readuntil(b'\r\n\r\n'), timeout=10)
            lines = req.decode('latin1').split('\r\n')
            parts = lines[0].split(' ')
            if len(parts) < 2:
                return
            headers = {}
            for line in lines[1:]:
                if ':' in line:
                    k, v = line.split(':', 1)
                    headers[k.strip().lower()] = v.strip()
            path = urlparse(parts[1]).path
            if path.rstrip('/').endswith(WS_PATH) and headers.get('upgrade', '').lower() == 'websocket':
                await ws_session(reader, writer, headers)
                return
            if static:
                await serve_static(writer, path)
            else:
                writer.write(b'HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\n'
                             b'Connection: close\r\n\r\n' + '스피드 레이싱 그랑프리 중계 장치가 켜져 있어요'.encode())
            await writer.drain()
        except Exception:
            pass
        finally:
            try:
                writer.close()
            except Exception:
                pass
    return handle


async def main():
    ap = argparse.ArgumentParser(description='스피드 레이싱 그랑프리 중계 장치')
    ap.add_argument('--host', default='0.0.0.0')
    ap.add_argument('--port', type=int, default=8080)
    ap.add_argument('--no-static', action='store_true', help='게임 파일은 보여 주지 않고 중계만 해요')
    a = ap.parse_args()
    server = await asyncio.start_server(make_handler(not a.no_static), a.host, a.port)
    asyncio.create_task(cleanup())
    print('스피드 레이싱 그랑프리 중계 장치: %s:%d (경로 %s)' % (a.host, a.port, WS_PATH), flush=True)
    async with server:
        await server.serve_forever()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
