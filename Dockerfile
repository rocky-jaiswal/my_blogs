FROM centos:7
MAINTAINER "Rocky Jaiswal" <rocky.jaiswal@gmail.com>

RUN yum -y update && yum -y install nginx ruby-devel rubygem-json nodejs git gcc gcc-c++ && dnf clean all

COPY nginx_conf /etc/nginx/nginx.conf

RUN gem update --system
RUN gem install bundler

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
