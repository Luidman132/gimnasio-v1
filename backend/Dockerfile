FROM php:8.2-apache

# Extensiones para MySQL (PDO) + OPcache (compila el PHP una sola vez)
RUN docker-php-ext-install pdo pdo_mysql opcache

# OPcache para producción: el código no cambia dentro de la imagen,
# así que no hace falta revalidar archivos en cada petición.
RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.memory_consumption=64'; \
        echo 'opcache.max_accelerated_files=1000'; \
        echo 'opcache.validate_timestamps=0'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

# No exponer la versión de PHP ni mostrar errores al cliente
RUN { \
        echo 'expose_php=Off'; \
        echo 'display_errors=Off'; \
        echo 'log_errors=On'; \
    } > /usr/local/etc/php/conf.d/seguridad.ini

RUN a2enmod rewrite

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html
