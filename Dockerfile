FROM nginx:1.15.3-alpine

ADD build /usr/share/nginx/html
