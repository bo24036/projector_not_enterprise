# Installing Projector — Mac

## Step 1 — Copy the app to your computer

Copy the entire `projector` folder from the shared drive into your `/Applications` folder and rename it `Projector`. You'll need your admin password.

Your folder structure should look like:
```
/Applications/Projector/
  install/
  index.html
  src/
  styles/
  ...
```

## Step 2 — First launch

1. Open `/Applications/Projector/install/mac/` in Finder
2. Double-click **launch-mac.command**
3. If you see a security warning: right-click the file → Open → Open (you only need to do this once)
4. Projector opens in its own Chrome window with no tabs or address bar

> **Requirement:** Python 3 must be installed — it almost certainly already is on your Mac. If you get an error, download Python from [python.org](https://python.org).

## Step 3 — Add to Dock

Drag **launch-mac.command** from `/Applications/Projector/install/mac/` into your Dock. From then on, clicking it starts the server (if not already running) and opens Projector in Chrome.

## Step 4 — Start automatically on login (recommended)

This keeps the server running in the background so Projector is always ready when you click the Dock icon.

1. System Settings → General → Login Items
2. Click **+** and add `/Applications/Projector/install/mac/launch-mac.command`

## Your data

All data is stored locally on your Mac inside `/Applications/Projector/.chrome-profile/`. It is never sent anywhere. Do not delete that folder.
