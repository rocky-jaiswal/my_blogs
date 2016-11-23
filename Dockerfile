FROM fedora:25
MAINTAINER "Rocky Jaiswal" <rocky.jaiswal@gmail.com>

RUN dnf update -y
RUN dnf install -y gcc gcc-c++ nodejs ruby-devel nginx
RUN dnf group install -y "C Development Tools and Libraries"
RUN dnf install -y redhat-rpm-config

COPY nginx_conf /etc/nginx/nginx.conf

RUN gem install bundler || true

#Add user
RUN /usr/sbin/groupadd --gid 9999 app
RUN /usr/sbin/adduser  --uid 9999 --gid 9999 app
RUN usermod -L app
RUN mkdir -p /home/app/my_app
ADD . /home/app/my_blogs
RUN chown -R app:app /home/app/

USER app
WORKDIR /home/app/my_blogs
RUN bundle install --deployment
RUN bundle exec middleman build

USER root
RUN cp -R /home/app/my_blogs/build/* /usr/share/nginx/html/

EXPOSE 80

CMD [ "/usr/sbin/nginx" ]
