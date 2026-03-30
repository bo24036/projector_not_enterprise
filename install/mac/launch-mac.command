#!/bin/bash
PORT=7337
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="http://localhost:$PORT"

# If server already running, just open Chrome
if lsof -ti tcp:$PORT > /dev/null 2>&1; then
  "$CHROME" --app="$URL" --user-data-dir="$APP_DIR/.chrome-profile" > /dev/null 2>&1 &
  exit 0
fi

cd "$APP_DIR"

# Start server in background, wait for it to be ready, then open Chrome
if command -v python3 > /dev/null 2>&1; then
  python3 -m http.server $PORT --quiet 2>/dev/null &
elif command -v python > /dev/null 2>&1; then
  python -m SimpleHTTPServer $PORT &
elif command -v node > /dev/null 2>&1; then
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
  " &
else
  osascript -e 'display alert "Projector could not start" message "Python or Node.js is required. Please install Python from python.org and try again."'
  exit 1
fi

# Wait until server is accepting connections, then open Chrome
while ! lsof -ti tcp:$PORT > /dev/null 2>&1; do
  sleep 0.1
done
"$CHROME" --app="$URL" --user-data-dir="$APP_DIR/.chrome-profile" > /dev/null 2>&1 &
