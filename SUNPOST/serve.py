#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import socket
import sys
import webbrowser
import threading
import time
import urllib.parse

# Serve from this directory
os.chdir(os.path.dirname(__file__))

start_port = int(os.getenv('PORT', '8080'))
if len(sys.argv) > 1:
    try:
        start_port = int(sys.argv[1])
    except ValueError:
        pass


def find_free_port(port, max_port=8100):
    while port <= max_port:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(('0.0.0.0', port))
                return port
            except OSError:
                port += 1
    return None


class SunpostRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Normalize the path (strip query/fragment; keep leading slash)
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path or '/'

        # Force root to login, regardless of how the browser/server resolves index.
        if path == '/':
            self.send_response(302)
            self.send_header('Location', '/login.html')
            self.end_headers()
            return

        return super().do_GET()


port = find_free_port(start_port)
if port is None:
    raise SystemExit('No available ports found between 8080 and 8100.')

HTTPServer.allow_reuse_address = True
server = HTTPServer(('0.0.0.0', port), SunpostRequestHandler)
url = f'http://127.0.0.1:{server.server_port}/login.html'


def _open_browser():
    # Give the server a moment to start
    time.sleep(0.4)
    try:
        webbrowser.open(url, new=2)
    except Exception:
        pass


print(f'Serving SunPost at http://0.0.0.0:{server.server_port}')
print('Opening site in your default browser...')
threading.Thread(target=_open_browser, daemon=True).start()
print('Press Ctrl+C to stop.')
server.serve_forever()

