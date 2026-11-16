FROM php:8.4-apache-bookworm
RUN apt-get update \
    && apt-get install -y --no-install-recommends libcurl4-openssl-dev libicu-dev libonig-dev \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql curl mbstring intl \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public WEXA_STORAGE_PATH=/var/www/html/storage
RUN sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/*.conf \
    && printf '<Directory /var/www/html/public>\n    AllowOverride All\n    Require all granted\n</Directory>\n' > /etc/apache2/conf-available/wexashelf.conf \
    && a2enconf wexashelf \
    && printf 'expose_php=Off\ndisplay_errors=Off\nlog_errors=On\npost_max_size=3M\nupload_max_filesize=2M\nmemory_limit=256M\n' > /usr/local/etc/php/conf.d/wexashelf.ini
WORKDIR /var/www/html
COPY LICENSE THIRD_PARTY_NOTICES.md ./
COPY php/app ./app
COPY php/cli ./cli
COPY php/resources ./resources
COPY php/public ./public
COPY php/storage/.htaccess php/storage/index.php ./storage/
RUN chown -R www-data:www-data storage && chmod 700 storage
EXPOSE 80
CMD ["apache2-foreground"]
