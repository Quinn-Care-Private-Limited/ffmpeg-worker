FROM quinninc/ffmpeg:latest
ENV FS_PATH=/volume
ENV PORT=3000

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
COPY . .
RUN npm install && npm run build
RUN npx puppeteer browsers install chrome

# Install Python dependencies for RunPod handler
RUN pip3 install --no-cache-dir -r runpod/requirements.txt

RUN wget -O ${FS_PATH}/index.html "https://storage.googleapis.com/lamar-infra-assets/index.html?v=42"
RUN wget -O ${FS_PATH}/bundle.min.js "https://storage.googleapis.com/lamar-infra-assets/bundle.min.js?v=42"

RUN chmod +x /app/scripts/run.sh

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/scripts/run.sh"]