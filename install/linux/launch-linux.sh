#!/bin/bash
PORT=7337
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
URL="http://localhost:$PORT"

open_chrome() {
  (sleep 1 && google-chrome --app="$URL" --user-data-dir="$APP_DIR/.chrome-profile" > /dev/null 2>&1) &
}

# If server already running, just open Chrome
if ss -tlnp 2>/dev/null | grep -q ":$PORT " || lsof -ti tcp:$PORT > /dev/null 2>&1; then
  google-chrome --app="$URL" --user-data-dir="$APP_DIR/.chrome-profile" > /dev/null 2>&1 &
  exit 0
fi

cd "$APP_DIR"

if command -v python3 > /dev/null 2>&1; then
  open_chrome
  python3 -m http.server $PORT --quiet 2>/dev/null
elif command -v python > /dev/null 2>&1; then
  open_chrome
  python -m SimpleHTTPServer $PORT
elif command -v node > /dev/null 2>&1; then
  open_chrome
  node -e "
    const http = require('http');
    const fs = require('fs');
    const path = require('path');
    const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.png':'image/png' };
    http.createServer((req, res) => {
      let file = path.join('$APP_DIR', req.url === '/' ? '/index.html' : req.url);
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'text/plain' });
        res.end(data);
      });
    }).listen($PORT);
  "
else
  zenity --error --text="Python or Node.js is required to run Projector.\nPlease install Python and try again." 2>/dev/null \
    || echo "Error: Python or Node.js required. Install from python.org." >&2
  exit 1
fi
