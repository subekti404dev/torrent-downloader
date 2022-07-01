FROM node:14.19 as builder

COPY mqtt-cli.deb ./
RUN apt update &&\
    apt install -y transmission-cli ./mqtt-cli.deb &&\
    rm ./mqtt-cli.deb

RUN mkdir /data

WORKDIR /app
COPY package.json download.js drive.js upload.js getconfig.js ./
RUN npm install --production
