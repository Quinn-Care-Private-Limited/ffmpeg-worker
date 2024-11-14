#!/bin/bash

# Enable error logging
exec 3>&1 4>&2
trap 'exec 2>&4 1>&3' 0 1 2 3
exec 1>/var/log/user-data.log 2>&1

echo "Starting setup on ARM64 architecture"

# Update system packages
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Install AWS CLI specifically for ARM64
curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
yum install -y unzip
unzip awscliv2.zip
./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update

# Install Amazon EFS utilities
yum install -y amazon-efs-utils

# Create mount point for EFS
mkdir -p /mnt/efs

# Mount EFS using the IP from your workflow file
echo "Mounting EFS..."
sudo mount -t nfs4 -o nfsvers=4.1 172.31.11.60:/ /mnt/efs
if [ $? -ne 0 ]; then
    echo "Failed to mount EFS"
    exit 1
fi

# Configure AWS credentials directly (replace with your actual credentials)
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AWS_DEFAULT_REGION=us-east-2

# Login to ECR using environment variables
echo "Logging into ECR..."
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 079464146245.dkr.ecr.us-east-2.amazonaws.com

# Pull the container with platform specification
echo "Pulling container..."
docker pull --platform linux/arm64 079464146245.dkr.ecr.us-east-2.amazonaws.com/ffmpeg-worker-server:latest
if [ $? -ne 0 ]; then
    echo "Failed to pull container"
    exit 1
fi

# Stop and remove existing container if it exists
docker stop my-ffmpeg-worker || true
docker rm my-ffmpeg-worker || true

# Run the container with platform specification
echo "Starting container..."
docker run -d \
  --platform linux/arm64 \
  -p 80:3000 \
  -e FS_PATH=/mnt/efs \
  -e CLIENT_ID=QUINNCLIENTID \
  -e CLIENT_SECRET=QUINNCLIENTSECRET \
  -v /mnt/efs:/mnt/efs \
  --name my-ffmpeg-worker \
  --restart always \
  079464146245.dkr.ecr.us-east-2.amazonaws.com/ffmpeg-worker-server:latest

# Verify container is running
sleep 5
if ! docker ps | grep my-ffmpeg-worker; then
    echo "Container failed to start. Checking logs..."
    docker logs my-ffmpeg-worker
    exit 1
fi

echo "Container started successfully"
docker ps
docker logs my-ffmpeg-worker