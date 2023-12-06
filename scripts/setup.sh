sudo apt update
sudo apt install ninja-build meson pkg-config libx264-dev libx265-dev nfs-common ca-certificates curl gnupg ruby-full nasm -y

# git clone --depth 1 https://github.com/Netflix/vmaf.git vmaf 
wget -O vmaf.tar.gz https://github.com/Netflix/vmaf/archive/refs/tags/v2.3.1.tar.gz
tar -xf vmaf.tar.gz
cd vmaf-2.3.1/libvmaf
meson build --buildtype release
ninja -vC build
sudo ninja -vC build install
cd ../..

# ffmpeg
# git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
wget -O ffmpeg.tar.xz https://ffmpeg.org/releases/ffmpeg-6.0.tar.xz
tar -xf ffmpeg.tar.xz 
cd ffmpeg-6.0
./configure --enable-gpl --enable-libx264 --enable-libx265 --enable-libvmaf --enable-nonfree
make -j4
sudo make install
cd ..

NODE_MAJOR=20
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install nodejs -y

sudo npm install forever -g
wget https://aws-codedeploy-us-east-2.s3.us-east-2.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto

rm -rf vmaf-2.3.1/ ffmpeg-6.0/ install ffmpeg.tar.xz vmaf.tar.gz