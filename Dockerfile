FROM us-east1-docker.pkg.dev/shopify-442807/xelp/ffmpeg:latest
RUN apt-get update -y && apt-get install -y tini nfs-common libtool
WORKDIR /app
COPY . .
RUN npm install && npm run build
RUN chmod +x /app/scripts/run.sh
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/scripts/run.sh"]