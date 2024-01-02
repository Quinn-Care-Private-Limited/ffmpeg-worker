FROM us-west1-docker.pkg.dev/quinn-video-platform/xelp/ffmpeg:latest
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD [ "npm", "start"]