# ✅ OPTIMIZATION 1: Use CLI image. Octane is the server, so we don't need FPM.
FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
# ✅ OPTIMIZATION 2: Added 'sockets' (Required for Octane) and 'zip' (Faster Composer)
RUN docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd sockets zip

# Install Redis Extension
RUN pecl install redis && docker-php-ext-enable redis

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ✅ OPTIMIZATION 3: Get RoadRunner Binary from the official image
# This ensures you have a compatible, pre-compiled binary without relying on runtime downloads
COPY --from=ghcr.io/roadrunner-server/roadrunner:2024 /usr/bin/rr /usr/local/bin/rr

# Set working directory
WORKDIR /var/www/html

# Create system user
RUN useradd -G www-data,root -u 1000 -d /home/dev dev
RUN mkdir -p /home/dev/.composer && \
    chown -R dev:dev /home/dev

# ✅ OPTIMIZATION 4: Octane Configuration
# Expose the Octane port (8000), not FPM's 9000
EXPOSE 8000

# Switch to user
USER dev

# ✅ OPTIMIZATION 5: Default Command
# Starts Octane using the binary we installed.
# We use "exec" form ["program", "arg"] so it handles server signals (SIGTERM) correctly.
CMD ["php", "artisan", "octane:start", "--server=roadrunner", "--host=0.0.0.0", "--port=8000"]
