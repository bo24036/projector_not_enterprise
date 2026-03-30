#!/bin/bash
PORT=7337
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="http://localhost:$PORT"

# If server already running, just open Chrome and exit
if lsof -ti tcp:$PORT > /dev/null 2>&1; then
  "$CHROME" --app="$URL" --user-data-dir="$APP_DIR/.chrome-profile" > /dev/null 2>&1 &
  exit 0
fi

# Start server fully detached from this shell (new process group, no children here)
if command -v python3 > /dev/null 2>&1; then
  (cd "$APP_DIR" && nohup python3 -m http.server $PORT > /dev/null 2>&1 &)
elif command -v python > /dev/null 2>&1; then
  (cd "$APP_DIR" && nohup python -m SimpleHTTPServer $PORT > /dev/null 2>&1 &)
elif command -v node > /dev/null 2>&1; then
  (cd "$APP_DIR" && nohup node -e "
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
  " > /dev/null 2>&1 &)
else
  osascript -e 'display alert "Projector could not start" message "Python or Node.js is required. Please install Python from python.org and try again."'
  exit 1
fi

# Wait until server is accepting connections (max 10 seconds), then open Chrome
WAIT=0
while ! lsof -ti tcp:$PORT > /dev/null 2>&1; do
  sleep 0.1
  WAIT=$((WAIT + 1))
  if [ $WAIT -ge 100 ]; then
    osascript -e 'display alert "Projector could not start" message "The server failed to start. Please try again or check that Python is installed correctly."'
    exit 1
  fi
done
"$CHROME" --app="$URL" --user-data-dir="$APP_DIR/.chrome-profile" > /dev/null 2>&1 &
echo ""
echo "Projector is running. You can close this window (click the red dot or press Cmd+W)."
echo "If asked about terminating processes, click Terminate — it won't affect the app."
echo ""
