# Simple static file server for downloads.quadframe.work
FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html/

# Configure nginx for CORS
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        add_header Access-Control-Allow-Origin *; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
