# Correr BeatSaber-Overlay con Docker

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Git

## Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd BeatSaber-Overlay

# 2. Buildear y levantar el contenedor
docker compose up -d --build
```

La primera vez descarga la imagen base y compila TypeScript; tarda unos minutos. Las veces siguientes es inmediato.

## Configurar en OBS

Agregar un **Browser Source** con la URL:

```
http://localhost:8080/index.html?ip=<IP_PC_BEATSABER>&pid=<PLAYER_ID>
```

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `ip` | IP de la PC donde corre Beat Saber | `192.168.1.100` |
| `pid` | Player ID de ScoreSaber | `76561198023909381` |
| `pcsk` | Skin de la Player Card | `default` |
| `scsk` | Skin de la Song Card | `default`, `freemium`, `reselim`, `dietah` |

Si el overlay corre en la **misma PC** que Beat Saber, usá `ip=localhost`.

Parámetros completos: ver `js/parameters.ts`.

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Detener el contenedor
docker compose down

# Rebuild tras cambios en el código
docker compose up -d --build
```

## Verificar que funciona

- Overlay vacío (sin Beat Saber): `http://localhost:8080/index.html`
- Proxy ScoreSaber: `http://localhost:8080/php/scoreSaberProxy.php?playerId=76561198023909381`
  → debe devolver JSON con datos del jugador

## Solución de problemas

**El proxy PHP devuelve error de conexión**
: El servidor no puede acceder a las APIs externas. Verificar conexión a internet desde el contenedor:
```bash
docker compose exec overlay curl -s https://scoresaber.com/api/player/76561198023909381/basic
```

**Beat Saber no conecta al overlay**
: Si Beat Saber corre en otra PC, asegurarse que el firewall permite el puerto 8080 y usar la IP correcta en el parámetro `ip=`.

**Cambios en el código no se reflejan**
: Siempre hacer `docker compose up -d --build` después de modificar archivos TypeScript.
