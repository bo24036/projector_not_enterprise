# Installing Projector

## Step 1 — Copy the app to your computer

Copy the entire `projector` folder from the shared drive to your computer. Keep it somewhere permanent — your Documents folder works well.

> Do not run it directly from OneDrive/SharePoint. It needs to live on your local machine.

## Step 2 — First launch

### Mac
1. Open the `projector` folder
2. Double-click **launch-mac.command**
3. If you see a security warning: right-click the file → Open → Open (you only need to do this once)
4. Your browser will open with Projector

### Windows
1. Open the `projector` folder
2. Double-click **launch-windows.bat**
3. If Windows Defender asks, click "More info" → "Run anyway" (you only need to do this once)
4. Your browser will open with Projector

### Linux
1. Open a terminal in the `projector` folder
2. Run: `chmod +x launch-linux.sh && ./launch-linux.sh`
3. Your browser will open with Projector

> **Requirement:** Python 3 must be installed. Most Macs and Linux machines already have it.
> Windows users: if you see an error, download Python from [python.org](https://python.org) and install it (check "Add to PATH" during setup), then try again.

## Step 3 — Pin to Dock / Taskbar

Once Projector is open in your browser:

### Mac
- Right-click the browser icon in the Dock → **Options** → **Keep in Dock**

### Windows
- Right-click the browser icon in the taskbar → **Pin to taskbar**

### Linux
- Right-click the browser icon in your taskbar → **Pin** (wording varies by desktop)

## Step 4 — Start automatically on login (optional but recommended)

This keeps the server running in the background so you can click the pinned icon any time.

### Mac
1. System Settings → General → Login Items
2. Click **+** and add **launch-mac.command**

### Windows
1. Press **Win + R**, type `shell:startup`, press Enter
2. Create a shortcut to **launch-windows.bat** in that folder

### Linux
Add to your desktop environment's autostart, or create `~/.config/autostart/projector.desktop`:
```
[Desktop Entry]
Type=Application
Name=Projector
Exec=/path/to/projector/launch-linux.sh
Hidden=false
X-GNOME-Autostart-enabled=true
```

## Your data

All data is stored locally in your browser's storage (IndexedDB). It is never sent anywhere. Clearing your browser's site data for `localhost` will erase it, so avoid doing that.
