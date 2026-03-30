#!/bin/bash
PORT=7337
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

# Check if already running on this port
if lsof -ti tcp:$PORT > /dev/null 2>&1; then
  open "http://localhost:$PORT"
  exit 0
fi

cd "$APP_DIR"

if command -v python3 > /dev/null 2>&1; then
  open "http://localhost:$PORT"
  python3 -m http.server $PORT --quiet 2>/dev/null
elif command -v python > /dev/null 2>&1; then
  open "http://localhost:$PORT"
  python -m SimpleHTTPServer $PORT
elif command -v node > /dev/null 2>&1; then
  open "http://localhost:$PORT"
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
  osascript -e 'display alert "Projector could not start" message "Python or Node.js is required. Please install Python from python.org and try again."'
  exit 1
fi
