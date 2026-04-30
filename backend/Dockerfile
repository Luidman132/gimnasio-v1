FROM php:8.2-apache

# Instalamos extensiones necesarias para MySQL (PDO)
RUN docker-php-ext-install pdo pdo_mysql

# Habilitamos mod_rewrite de Apache por si lo necesitas
RUN a2enmod rewrite

# Copiamos el código de la API al contenedor
COPY . /var/www/html/

# Ajustamos permisos
RUN chown -R www-data:www-data /var/www/html