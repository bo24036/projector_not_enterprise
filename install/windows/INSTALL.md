# Installing Projector — Windows

## Step 1 — Copy the app to your computer

Copy the entire `projector` folder from the shared drive to a permanent location on your computer. `C:\Program Files\Projector\` is a good choice (you'll need admin rights), or your Documents folder if you prefer.

Your folder structure should look like:
```
C:\Program Files\Projector\
  install\
  index.html
  src\
  styles\
  ...
```

## Step 2 — First launch

1. Open the `install\windows\` folder inside your Projector installation
2. Double-click **launch-windows.bat**
3. If Windows Defender shows a warning, click "More info" → "Run anyway" (you only need to do this once)
4. Projector opens in its own Chrome window with no tabs or address bar

> **Requirement:** Python 3 must be installed. If you see an error, download Python from [python.org](https://python.org) — check "Add Python to PATH" during setup — then try again.

## Step 3 — Pin to Taskbar

1. Open `install\windows\` inside your Projector folder
2. Right-click **setup-shortcut.ps1** → **Run with PowerShell**
3. If prompted about execution policy, type `Y` and press Enter
4. A **Projector** shortcut appears on your Desktop
5. Right-click that shortcut → **Pin to taskbar**
6. You can delete the Desktop shortcut now if you like — the taskbar entry is independent

From then on, clicking the taskbar icon starts the server (if not already running) and opens Projector in its own Chrome window.

## Step 4 — Start automatically on login (recommended)

This keeps the server running in the background so Projector is always ready when you click the taskbar icon.

1. Press **Win + R**, type `shell:startup`, press Enter
2. Create a shortcut to `launch-windows.bat` in the folder that opens

## Your data

All data is stored locally on your computer inside the `.chrome-profile\` folder in your Projector installation. It is never sent anywhere. Do not delete that folder.
