FROM ruby:2.4.2-jessie

RUN apt-get update && apt-get install -y build-essential nginx
RUN gem install bundler
RUN gem install therubyracer

COPY nginx_conf /etc/nginx/nginx.conf

RUN mkdir -p /opt/my_blogs
WORKDIR /opt/my_blogs

ADD . /opt/my_blogs
RUN bundle install --deployment
RUN bundle exec middleman build

EXPOSE 8080
CMD [ "/usr/sbin/nginx" ]
