FROM us-west1-docker.pkg.dev/quinn-video-platform/xelp/ffmpeg:latest
RUN apt-get update -y && apt-get install -y nfs-common libtool 
WORKDIR /app
COPY . .
RUN npm install && npm run build
RUN mkdir -p $FS_PATH
RUN mount -o nolock $FS_IP:/$FS_SHARE_NAME $FS_PATH

CMD ["node", "build/index.js"]