# Pakai PHP versi 8.2 dengan Apache
FROM php:8.2-apache

# Copy semua file project ke dalam container
COPY . /var/www/html/

# Set permission
RUN chown -R www-data:www-data /var/www/html/ \
    && chmod -R 755 /var/www/html/

# Expose port 80
EXPOSE 80

# Aktifkan error reporting
RUN echo "display_errors=On\nerror_reporting=E_ALL" > /usr/local/etc/php/conf.d/docker-php-errors.ini