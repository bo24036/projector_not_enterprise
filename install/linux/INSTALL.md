# Installing Projector — Linux

## Step 1 — Copy the app to your computer

Copy the entire `projector` folder from the shared drive to a permanent location. `/opt/Projector/` is conventional for shared installs (requires sudo), or `~/Applications/Projector/` if you prefer to keep it in your home directory.

Your folder structure should look like:
```
/opt/Projector/
  install/
  index.html
  src/
  styles/
  ...
```

## Step 2 — First launch

Open a terminal and run:

```bash
chmod +x /opt/Projector/install/linux/launch-linux.sh
/opt/Projector/install/linux/launch-linux.sh
```

Projector opens in its own Chrome window with no tabs or address bar.

> **Requirement:** Python 3 and Google Chrome must be installed. Python 3 is almost certainly already present. Install Chrome from [google.com/chrome](https://google.com/chrome) if needed.

## Step 3 — Pin to Taskbar

While Projector is open, right-click the Chrome icon in your taskbar → **Pin** (wording varies by desktop environment).

## Step 4 — Start automatically on login (recommended)

This keeps the server running in the background so Projector is always ready when you click the taskbar icon.

Create `~/.config/autostart/projector.desktop` with the following content (adjust the path if you installed somewhere other than `/opt/Projector`):

```ini
[Desktop Entry]
Type=Application
Name=Projector
Exec=/opt/Projector/install/linux/launch-linux.sh
Hidden=false
X-GNOME-Autostart-enabled=true
```

## Your data

All data is stored locally on your computer inside the `.chrome-profile/` folder in your Projector installation. It is never sent anywhere. Do not delete that folder.
