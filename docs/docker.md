# Run BeatSaber-Overlay with Docker

## Who This Is For

Use this guide if you want the easiest local setup.

Typical beginner scenario:

- Beat Saber runs on the same PC as OBS
- BeatSaberPlus is installed with BSManager
- You want to open a local setup page, generate the final OBS URL, and paste it into OBS

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Git](https://git-scm.com/downloads) installed
- Beat Saber installed
- At least one supported plugin installed in Beat Saber

For most users, **BeatSaberPlus** installed through **BSManager** is the simplest starting point.

## Before You Start

If you already did the requirements above, the most common beginner setup looks like this:

- Docker Desktop is installed and currently open
- Git is installed
- Beat Saber is installed
- **BeatSaberPlus** is installed with **BSManager**
- Beat Saber, this overlay, and OBS will run on the same PC

That setup is enough for most people to get a working local overlay.

## Start the Overlay

Open a command-line window first:

- On Windows, you can open **PowerShell**, **Windows Terminal**, or **Command Prompt**
- Open it in any folder where you want the project folder to be created, for example `Desktop` or `Documents`
- Then copy and paste the commands below into that window and press `Enter`

```bash
git clone https://github.com/XelNagah/BeatSaber-Overlay.git
cd BeatSaber-Overlay
docker compose up -d --build
```

What those commands do:

- `git clone ...` downloads this repository to a new `BeatSaber-Overlay` folder
- `cd BeatSaber-Overlay` moves the command line into that folder
- `docker compose up -d --build` builds and starts the local overlay service

The first run downloads the base image and builds the TypeScript output, so it may take a few minutes.

If everything starts correctly, leave that project folder on your PC. You will use the running local server from your browser and OBS.

## Open the Setup Page

Once the container is running, open:

- [http://localhost:8080/index.html](http://localhost:8080/index.html)

From there:

1. Click the settings button.
2. Enter your ScoreSaber profile URL or player ID if you want the **Player Card** to show your profile and rank.
3. Adjust the card settings you want.
4. Copy the generated URL.

If you followed the common beginner setup above, the default connection settings usually work without changes.

## Add It to OBS

In OBS:

1. Add a new **Browser Source** to your scene.
2. Paste the generated URL from the setup page.
3. Resize and position it like any other browser-based overlay.

If Beat Saber, the mod, the overlay, and OBS are all running on the same PC, the default setup values usually work without extra changes.

## Verify It Works

Quick checks:

- Setup page loads: [http://localhost:8080/index.html](http://localhost:8080/index.html)
- ScoreSaber proxy responds:
  - [http://localhost:8080/php/scoreSaberProxy.php?playerId=76561198023909381](http://localhost:8080/php/scoreSaberProxy.php?playerId=76561198023909381)

What to expect:

- The overlay page can open even if Beat Saber is closed
- Live song/game data only appears when Beat Saber is running and a supported plugin is active
- The **Song Card** can still reflect live gameplay without a ScoreSaber profile
- The **Player Card** needs your ScoreSaber profile URL or ID to show your player info

## Useful Commands

```bash
# View logs
docker compose logs -f

# Stop the container
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

## Troubleshooting

**The page opens, but no live data appears**

- Make sure Beat Saber is running
- Make sure one supported plugin is installed and enabled
- If you want a concrete reference setup, start with BeatSaberPlus on the same PC

**The Player Card is empty**

- Open the setup page and enter your ScoreSaber profile URL or player ID

**The PHP proxy fails**

- The container may not be able to reach external APIs
- Test network access from the container:

```bash
docker compose exec overlay curl -s https://scoresaber.com/api/player/76561198023909381/basic
```

**Beat Saber runs on another PC**

- Open the setup page and change the connection target to the PC running Beat Saber instead of leaving the local default
- Make sure that PC allows the required local network traffic
