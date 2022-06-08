FROM node:16.3.0-alpine as builder

RUN apk add transmission-cli
RUN mkdir /data

WORKDIR /app
COPY package.json download.js drive.js upload.js ./
RUN npm install --production
