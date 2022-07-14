FROM node:16.3.0-alpine as builder

WORKDIR /app
COPY package.json main.js ./
COPY src /app/src

RUN npm install --production && npm run build

FROM alpine
RUN apk add --no-cache transmission-cli mosquitto-clients

RUN mkdir /data

WORKDIR /app
# COPY main.js package.json ./
# COPY src /app/src
# COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/main /usr/bin/torrent
CMD [ "mosquitto -c /etc/mosquitto/mosquitto.conf" ]
