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
5. A Terminal window will open briefly — you can close it (Cmd+W). If it asks about terminating processes, click **Terminate** — this is harmless and won't affect the running app.

> **Requirement:** Python 3 must be installed — it almost certainly already is on your Mac. If you get an error, download Python from [python.org](https://python.org).

## Step 3 — Add to Dock

1. Open `/Applications/Projector/install/mac/` in Finder
2. Drag **launch-mac.command** to the right-hand side of your Dock (the section after the separator, where documents and folders live)
3. It will appear as a script icon in the Dock

From then on, clicking it starts the server (if not already running) and opens Projector in its own Chrome window.

> **Tip:** If you'd prefer it in the app section of the Dock (left of the separator), launch it first so it appears in the Dock, then right-click the bouncing icon → **Options** → **Keep in Dock**.

## Step 4 — Start automatically on login (recommended)

This keeps the server running in the background so Projector is always ready when you click the Dock icon.

1. System Settings → General → Login Items
2. Click **+** and add `/Applications/Projector/install/mac/launch-mac.command`

## Your data

All data is stored locally on your Mac inside `/Applications/Projector/.chrome-profile/`. It is never sent anywhere. Do not delete that folder.
