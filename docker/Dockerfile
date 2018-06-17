FROM node:8-alpine as build

WORKDIR /tmp

COPY mq/package*.json /tmp/mq-testtools/

RUN apk update && apk add --no-cache --virtual .build-deps \
        python \
        g++ \
        make \
	git
RUN cd mq-testtools && npm install
RUN apk del .build-deps


FROM node:8-alpine

RUN apk add --no-cache jq bash openssl curl

COPY . /mq-testtools
COPY --from=build /var/cache/apk /var/cache/apk
COPY --from=build /tmp/mq-testtools/node_modules /mq-testtools/mq/node_modules

ENV TERM=xterm-256color

WORKDIR /mq-testtools/test


