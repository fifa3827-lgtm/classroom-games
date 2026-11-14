# 소리 다듬기: 앞 무음 자르기, 최대 길이 자르기, 끝 페이드, 음량 맞춤 → mp3 + ogg
# 사용: python audio_proc.py 입력 출력이름(확장자 없이) [--max 초] [--lufs -18] [--music] [--loop]
#  --music: 음악(앞 무음만 살짝, 페이드 길게). --loop: 끝 1초를 처음 1초와 겹쳐 이음새 없게
import sys, argparse, subprocess, json, os, tempfile

def dur(p):
    o = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', p], capture_output=True, text=True)
    return float(json.loads(o.stdout)['format']['duration'])

def run(args):
    r = subprocess.run(['ffmpeg', '-y', '-v', 'error'] + args, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr); sys.exit(1)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--max', type=float, default=0)
    ap.add_argument('--lufs', type=float, default=-18)
    ap.add_argument('--music', action='store_true')
    ap.add_argument('--loop', action='store_true')
    o = ap.parse_args()
    tmp = tempfile.mkdtemp()
    a = os.path.join(tmp, 'a.wav')
    f = ['silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.01']
    if o.max:
        f.append(f'atrim=0:{o.max}')
    run(['-i', o.src, '-af', ','.join(f), '-ar', '44100', '-ac', '2', a])
    d = dur(a)
    b = os.path.join(tmp, 'b.wav')
    if o.loop:
        # 끝 1초를 처음 1초 위에 겹친다: [몸통(1~d)] 의 끝과 [처음 1초] 를 acrossfade
        x = 1.0
        run(['-i', a, '-filter_complex',
             f'[0]atrim=0:{x},asetpts=PTS-STARTPTS[h];[0]atrim={x}:{d},asetpts=PTS-STARTPTS[body];[body][h]acrossfade=d={x}:c1=tri:c2=tri[o]',
             '-map', '[o]', b])
    else:
        fade = 1.5 if o.music else 0.05
        run(['-i', a, '-af', f'afade=t=out:st={max(0, d - fade)}:d={fade}', b])
    c = os.path.join(tmp, 'c.wav')
    run(['-i', b, '-af', f'loudnorm=I={o.lufs}:TP=-1.5:LRA=11', '-ar', '44100', c])
    br = '128k' if o.music else '96k'
    run(['-i', c, '-b:a', br, o.dst + '.mp3'])
    run(['-i', c, '-c:a', 'libvorbis', '-q:a', '4' if o.music else '3', o.dst + '.ogg'])
    print(f'{o.dst}: {dur(o.dst + ".mp3"):.2f}s')

if __name__ == '__main__':
    main()
