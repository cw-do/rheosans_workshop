"""Serve this folder on 127.0.0.1 and open the EQ-SANS introduction deck.

The deck embeds the 3D EQ-SANS model (eqsans-model/), which is built from ES modules.
Browsers refuse to load modules from file://, so the deck has to come from a local
web server. Nothing is sent anywhere: the server only listens on this machine.

Usage:
    python serve.py            # serve and open the deck in the default browser
    python serve.py --no-open  # serve only (used for testing)
    python serve.py --port 8719
"""
import argparse
import functools
import http.server
import os
import sys
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2'}

    def end_headers(self):
        # Edits to the deck or the model show up on a plain refresh.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *a):
        pass


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--port', type=int, default=8718)
    ap.add_argument('--no-open', action='store_true')
    ap.add_argument('--page', default='eqsans_intro/index.html')
    args = ap.parse_args()

    try:
        srv = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), functools.partial(Handler, directory=HERE))
    except OSError:
        # Already running from an earlier launch: just open the page again.
        url = f'http://127.0.0.1:{args.port}/{args.page}'
        print('Port in use, assuming the server is already running:', url)
        if not args.no_open:
            webbrowser.open(url)
        return
    url = f'http://127.0.0.1:{args.port}/{args.page}'
    print('Serving', HERE)
    print('Deck:  ', url)
    print('Model: ', f'http://127.0.0.1:{args.port}/eqsans-model/index.html')
    print('Close this window (or Ctrl+C) to stop.')
    if not args.no_open:
        webbrowser.open(url)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    sys.exit(main())
