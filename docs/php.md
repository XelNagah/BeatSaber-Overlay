# Run BeatSaber-Overlay with Apache + PHP

## Who This Is For

Use this guide if you already have a local Apache/PHP environment and prefer that over Docker.

If you just want the easiest path, use the Docker guide instead:

- [docs/docker.md](docs/docker.md)

## Requirements

- **Apache 2.4+** with `mod_expires`, `mod_headers`, and `mod_rewrite`
- **PHP 8.0+** with `allow_url_fopen = On`
- **Node.js 18+** and **npm** to build the TypeScript files
- Git
- Beat Saber installed
- At least one supported plugin installed in Beat Saber

For most users, **BeatSaberPlus** installed through **BSManager** is the simplest plugin path.

## Install and Build

```bash
git clone <your-repo-url>
cd BeatSaber-Overlay
npm install
npm run build
```

That generates the `.js` files in `js/` from the TypeScript sources.

## Configure Apache

Serve the project directory with `AllowOverride All` so the `.htaccess` rules work:

```apache
<Directory "/path/to/BeatSaber-Overlay">
    AllowOverride All
    Options -Indexes
</Directory>
```

On Debian/Ubuntu:

```bash
sudo a2enmod expires headers rewrite
sudo systemctl restart apache2
```

On Windows with XAMPP, enable the required modules in `httpd.conf`.

## Configure PHP

Make sure `allow_url_fopen` is enabled in `php.ini`:

```ini
allow_url_fopen = On
```

Typical `php.ini` locations:

| Environment | Typical path |
|-------------|--------------|
| Linux | `/etc/php/8.x/apache2/php.ini` |
| XAMPP Windows | `C:\xampp\php\php.ini` |
| Laragon | `C:\laragon\bin\php\php-8.x\php.ini` |

Restart Apache after changing `php.ini`.

## Cache Directory Permissions

The PHP proxies need write access to:

- `php/Cache`
- `php/cache`

On Linux/macOS:

```bash
mkdir -p php/Cache php/cache
chown -R www-data:www-data php/Cache php/cache
```

On Windows with XAMPP/Laragon, this is usually not needed.

## Open the Setup Page

After Apache is serving the project, open:

- [http://localhost/BeatSaber-Overlay/index.html](http://localhost/BeatSaber-Overlay/index.html)

Adjust the path if your Apache document root uses a different project location.

From there:

1. Click the settings button.
2. Enter your ScoreSaber profile URL or player ID if you want the **Player Card** to show your profile and rank.
3. Adjust the card settings you want.
4. Copy the generated URL.

## Add It to OBS

In OBS:

1. Add a new **Browser Source** to your scene.
2. Paste the generated URL from the setup page.
3. Resize and position it like any other browser-based overlay.

If Beat Saber, the mod, the overlay, and OBS are all running on the same PC, the default setup values usually work without extra changes.

## Verify It Works

Quick checks:

- Setup page loads: [http://localhost/BeatSaber-Overlay/index.html](http://localhost/BeatSaber-Overlay/index.html)
- ScoreSaber proxy responds:
  - [http://localhost/BeatSaber-Overlay/php/scoreSaberProxy.php?playerId=76561198023909381](http://localhost/BeatSaber-Overlay/php/scoreSaberProxy.php?playerId=76561198023909381)

What to expect:

- The overlay page can open even if Beat Saber is closed
- Live song/game data only appears when Beat Saber is running and a supported plugin is active
- The **Song Card** can still reflect live gameplay without a ScoreSaber profile
- The **Player Card** needs your ScoreSaber profile URL or ID to show your player info

## Troubleshooting

**The page opens, but no live data appears**

- Make sure Beat Saber is running
- Make sure one supported plugin is installed and enabled
- If you want a concrete reference setup, start with BeatSaberPlus on the same PC

**The Player Card is empty**

- Open the setup page and enter your ScoreSaber profile URL or player ID

**PHP proxy returns HTTP 500**

- The most common cause is `allow_url_fopen = Off`
- Check your PHP error logs

**Headers from `.htaccess` are not applied**

- Make sure `mod_headers` is enabled
- Make sure `AllowOverride All` is configured for the project directory

**JavaScript does not load / blank page**

- Run `npm run build`
- Confirm that the generated `.js` files exist in `js/`

**Beat Saber runs on another PC**

- Open the setup page and change the connection target to the PC running Beat Saber instead of leaving the local default
- Make sure that PC allows the required local network traffic
