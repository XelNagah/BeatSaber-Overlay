# Correr BeatSaber-Overlay con Apache + PHP

## Requisitos

- **Apache 2.4+** con módulos `mod_expires` y `mod_headers` habilitados
- **PHP 8.0+** con `allow_url_fopen = On`
- **Node.js 18+** y **npm** (solo para compilar TypeScript)
- Git

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd BeatSaber-Overlay
```

### 2. Compilar TypeScript

```bash
npm install
npm run build
```

Genera los archivos `.js` en `js/` a partir de los `.ts`.

### 3. Configurar Apache

El directorio del proyecto debe servirse con `AllowOverride All` para que el `.htaccess` funcione. Agregar al VirtualHost o al bloque `<Directory>` correspondiente:

```apache
<Directory "/ruta/al/BeatSaber-Overlay">
    AllowOverride All
    Options -Indexes
</Directory>
```

Habilitar los módulos requeridos (en sistemas Debian/Ubuntu):

```bash
sudo a2enmod expires headers rewrite
sudo systemctl restart apache2
```

En Windows con XAMPP: activar los módulos en `httpd.conf` descomentando las líneas `LoadModule expires_module` y `LoadModule headers_module`.

### 4. Configurar PHP

Verificar que `allow_url_fopen` esté activado en `php.ini`:

```ini
allow_url_fopen = On
```

Ubicación de `php.ini` según entorno:

| Entorno | Ruta típica |
|---------|-------------|
| Linux | `/etc/php/8.x/apache2/php.ini` |
| XAMPP Windows | `C:\xampp\php\php.ini` |
| Laragon | `C:\laragon\bin\php\php-8.x\php.ini` |

Reiniciar Apache después de modificar `php.ini`.

### 5. Permisos de escritura (Linux/Mac)

Los proxies PHP necesitan escribir en los directorios de caché:

```bash
mkdir -p php/Cache php/cache
chown -R www-data:www-data php/Cache php/cache
```

En Windows con XAMPP/Laragon no hace falta; Apache ya tiene permisos de escritura por defecto.

## Configurar en OBS

Agregar un **Browser Source** con la URL:

```
http://localhost/BeatSaber-Overlay/index.html?ip=<IP_PC_BEATSABER>&pid=<PLAYER_ID>
```

Ajustar la ruta según dónde esté el proyecto dentro del directorio raíz de Apache (`htdocs`, `www`, etc.).

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `ip` | IP de la PC donde corre Beat Saber | `192.168.1.100` |
| `pid` | Player ID de ScoreSaber | `76561198023909381` |
| `pcsk` | Skin de la Player Card | `default` |
| `scsk` | Skin de la Song Card | `default`, `freemium`, `reselim`, `dietah` |

Parámetros completos: ver `js/parameters.ts`.

## Verificar que funciona

- Overlay vacío (sin Beat Saber): `http://localhost/BeatSaber-Overlay/index.html`
- Proxy ScoreSaber: `http://localhost/BeatSaber-Overlay/php/scoreSaberProxy.php?playerId=76561198023909381`
  → debe devolver JSON con datos del jugador

## Solución de problemas

**Error 500 en los proxies PHP**
: Activar logs de error PHP y revisar. Causa más común: `allow_url_fopen = Off`.

**Headers del .htaccess no aplican**
: `mod_headers` no está habilitado o `AllowOverride All` no está configurado. Verificar con `apache2ctl -M | grep headers`.

**JS no carga / pantalla en blanco**
: Falta correr `npm run build`. Verificar que existan archivos `.js` en `js/`.

**Beat Saber no conecta**
: Si Beat Saber corre en otra PC, verificar que el firewall permita el puerto donde sirve Apache (80 por defecto) y usar la IP correcta en `ip=`.
