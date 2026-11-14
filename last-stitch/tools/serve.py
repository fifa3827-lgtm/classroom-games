# 시험용 서버 (캐시 끔). 사용: python last-stitch/tools/serve.py 8137
import sys, os, http.server, functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8137
http.server.ThreadingHTTPServer(('', port), functools.partial(H, directory=root)).serve_forever()
