FROM ruby:2.4.2-jessie

RUN apt-get update && apt-get install -y build-essential
RUN gem install bundler
RUN gem install therubyracer

RUN mkdir -p /opt/my_blogs
WORKDIR /opt/my_blogs

ADD . /opt/my_blogs
RUN bundle install --deployment
RUN bundle exec middleman build
