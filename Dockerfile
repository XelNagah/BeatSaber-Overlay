# Stage 1: compile TypeScript → JavaScript
FROM node:20-alpine AS builder
WORKDIR /build
COPY package.json package-lock.json tsconfig.json ./
COPY js/ ./js/
RUN npm ci && npm run build

# Stage 2: Apache + PHP runtime
FROM php:8.2-apache

# mod_expires and mod_headers needed by .htaccess cache rules
RUN a2enmod expires headers rewrite

# allow_url_fopen required by scoreSaberProxy.php and beatLeaderProxy.php
RUN echo "allow_url_fopen = On" >> /usr/local/etc/php/conf.d/overlay.ini

# AllowOverride All so .htaccess directives take effect
RUN printf '<Directory /var/www/html>\n\tAllowOverride All\n\tOptions -Indexes\n</Directory>\n' \
    > /etc/apache2/conf-available/overlay.conf \
    && a2enconf overlay

# Copy project source, then overwrite js/ with compiled output from builder
COPY . /var/www/html/
COPY --from=builder /build/js/ /var/www/html/js/

# Create PHP cache dirs with write permissions for www-data
RUN mkdir -p /var/www/html/php/Cache /var/www/html/php/cache \
    && chown -R www-data:www-data /var/www/html/php/Cache /var/www/html/php/cache

EXPOSE 80
