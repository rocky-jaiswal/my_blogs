FROM fedora
MAINTAINER http://fedoraproject.org/wiki/Cloud

RUN dnf -y update  && dnf clean all
RUN dnf -y install nginx ruby-devel nodejs git gcc && dnf clean all

RUN echo "daemon off;" >> /etc/nginx/nginx.conf

RUN gem update --system
RUN gem install bundler
RUN mkdir /etc/nginx/sites-enabled
COPY nginx_conf /etc/nginx/sites-enabled/rockyjin

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
EXPOSE 80

CMD [ "/usr/sbin/nginx" ]