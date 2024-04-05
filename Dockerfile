FROM us-west1-docker.pkg.dev/quinn-video-platform/xelp/ffmpeg:latest
RUN apt-get update -y && apt-get install -y tini nfs-common libtool netbase
WORKDIR /app
COPY . .
RUN npm install && npm run build
RUN chmod +x /app/scripts/run.sh
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/scripts/run.sh"]