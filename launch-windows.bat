@echo off
setlocal
set PORT=7337
set APP_DIR=%~dp0

:: Check if already running on this port
netstat -an | findstr ":%PORT% " | findstr "LISTENING" > nul 2>&1
if %errorlevel% == 0 (
    start http://localhost:%PORT%
    exit /b 0
)

cd /d "%APP_DIR%"

:: Try Python 3
where python > nul 2>&1
if %errorlevel% == 0 (
    start http://localhost:%PORT%
    python -m http.server %PORT%
    exit /b 0
)

:: Try Python via py launcher
where py > nul 2>&1
if %errorlevel% == 0 (
    start http://localhost:%PORT%
    py -m http.server %PORT%
    exit /b 0
)

:: Try Node
where node > nul 2>&1
if %errorlevel% == 0 (
    start http://localhost:%PORT%
    node -e "const http=require('http'),fs=require('fs'),path=require('path');const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png'};http.createServer((req,res)=>{let f=path.join(process.env.APP_DIR||'.',req.url==='/'?'/index.html':req.url);fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'text/plain'});res.end(d);});}).listen(%PORT%);"
    exit /b 0
)

:: Nothing found
powershell -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Python or Node.js is required to run Projector. Please install Python from python.org and try again.', 'Projector')"
exit /b 1
