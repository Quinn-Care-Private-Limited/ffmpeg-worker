FROM --platform=$TARGETPLATFORM 079464146245.dkr.ecr.us-east-2.amazonaws.com/ffmpeg-library:latest
RUN apt-get update -y && apt-get install -y tini nfs-common libtool 
WORKDIR /app
COPY . .
RUN npm install && npm run build
RUN chmod +x /app/scripts/run.sh
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/scripts/run.sh"]
EXPOSE 3000