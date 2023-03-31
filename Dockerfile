FROM node:16.3.0-alpine as builder

WORKDIR /app
COPY package.json *.js ./
COPY src /app/src
RUN npm install && npm run build
RUN apk add curl &&\
    curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip &&\
    unzip rclone-current-linux-amd64.zip &&\
    cd rclone-*-linux-amd64 && chmod +x rclone && cp rclone /app


FROM alpine

WORKDIR /app
COPY scripts/* /usr/bin/
COPY --from=builder /app/main /usr/bin/torrent
COPY --from=builder /app/hlst /usr/bin/vania
COPY --from=builder /app/rclone /usr/bin/rclone
RUN apk add --no-cache transmission-cli mosquitto-clients jq \
    openssh tree sshpass rsync zip curl ffmpeg fuse &&\
    mkdir -p /data ~/.ssh && \
    ssh-keygen -b 2048 -t rsa -f /tmp/sshkey -q -N "" &&\
    ssh-keyscan -H uripsub.dev >> ~/.ssh/known_hosts &&\
    chmod +x /usr/bin/*
CMD [ "mosquitto -c /etc/mosquitto/mosquitto.conf" ]
