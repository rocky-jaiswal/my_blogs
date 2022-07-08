FROM debian:11

# Experimental stuff

RUN apt-get update && apt-get install -y curl unzip
RUN curl https://bun.sh/install | bash

RUN mkdir -p /opt/app
ADD . /opt/app
WORKDIR /opt/app

RUN /root/.bun/bin/bun install

EXPOSE 3000

CMD ["/root/.bun/bin/bun", "dev"]