FROM quinninc/ffmpeg:latest

ENV FS_PATH=/volume
ENV PORT=3000
ENV USE_FILE_SERVER=false
# Set Puppeteer cache directory to avoid path issues
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

RUN apt-get update -y && apt-get install -y tini nfs-common libtool \
    # Python dependencies
    python3 \
    python3-pip \
    python3-venv \
    # Chrome dependencies
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

WORKDIR /app

COPY package.json .
RUN npm install

# Install Chrome with version matching the installed puppeteer version
# Using --install-deps=false to skip redundant dependency installation
RUN npx puppeteer browsers install chrome@136.0.7103.49 --path /app/.cache/puppeteer

# Install Python dependencies for RunPod handler
COPY runpod/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

RUN mkdir -p ${FS_PATH} && \
wget -O ${FS_PATH}/index.html "https://common-bucket.quinn.live/pixie.html" && \
wget -O ${FS_PATH}/bundle.min.js "https://common-bucket.quinn.live/pixie.min.js"

COPY . .
RUN npm run build

RUN chmod +x /app/scripts/run.sh

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/scripts/run.sh"]