ffmpeg -i original.mp4 -ss 00:00:00 -t 00:01:00 -c:v copy -c:a copy output.mp4
ffmpeg -i output.mp4 -c:v libx264 -c:a copy -crf 23 output_crf_23.mp4

ffmpeg -i output.mp4 -pix_fmt yuv420p output_yuv.mp4

ffmpeg -i /mnt/efs/test/output_crf_23.mp4 -i /mnt/efs/test/output.mp4 -lavfi "[0:v]scale=1920:1080:flags=bicubic[distorted];[1:v]scale=1920:1080:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=/home/ec2-user/models/vmaf_v0.6.1.json':n_subsample=10:n_threads=32" -f null -
ffmpeg -i /mnt/efs/test/output_crf_23.mp4 -i /mnt/efs/test/output.mp4 -lavfi "libvmaf=model='path=/home/ubuntu/models/vmaf_v0.6.1.json':n_subsample=10:n_threads=32" -f null -

ffmpeg -i /mnt/efs/test/output.mp4 -pix_fmt yuv420p /mnt/efs/test/output_yuv.mp4
ffmpeg -i output.mp4 -c:v copy -c:a copy -pix_fmt yuv420p output_yuv.mp4

ffmpeg -y -i /mnt/efs/test/output.mp4 /mnt/efs/test/output_yuv.yuv
ffmpeg -y -i /mnt/efs/test/output.mp4 -c:v libx264 -crf 23 /mnt/efs/test/output_yuv_crf_23.mp4
ffmpeg -y -i /mnt/efs/test/output_yuv_crf_23.mp4 /mnt/efs/test/output_yuv_crf_23.yuv

#!/usr/bin/env bash
start=$(date +%s%N)
ffmpeg -i /efs/test/output_crf_23.mp4 -i /efs/test/output.mp4 -lavfi "[0:v]scale=1920:1080:flags=bicubic[distorted];[1:v]scale=1920:1080:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=/efs/bench-test/model.json':n_subsample=10:n_threads=8" -f null -
end=$(date +%s%N)
echo "Elapsed time: $(($(($end-$start))/1000000)) ms"

ffmpeg -i /efs/-rgV7miGu3xyUteJhTuE8/tmp/chunk_2_1080x1920_25.mp4 -i /efs/-rgV7miGu3xyUteJhTuE8/chunks/chunk_2.mp4 -lavfi "[0:v]scale=-2:1920:flags=bicubic[distorted];[1:v]scale=-2:1920:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=/home/ubuntu/vmaf/model/vmaf_v0.6.1.json':n_subsample=10:n_threads=8" -f null -

ffmpeg -i /efs/-rgV7miGu3xyUteJhTuE8/chunks/chunk_2.mp4 -c:v libx264 -c:a copy -crf 23 output_crf_23.mp4


ffmpeg -i /efs/test/chunks/chunk_0.mp4 -c:v libx264 -c:a copy -crf 18 /efs/test/tmp/chunk_0.mp4 

ffmpeg -i /efs/test/tmp/chunk_0_1920x1080_23.mp4 -i /efs/test/chunks/chunk_0.mp4 -lavfi "[0:v]scale=1920:1080:flags=bicubic[distorted];[1:v]scale=1920:1080:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=/home/ubuntu/vmaf/model/vmaf_v0.6.1.json':n_subsample=10:n_threads=8" -f null -
ffmpeg -i /efs/test/tmp/chunk_0_1120x630_28.mp4 -i /efs/test/chunks/chunk_0.mp4 -lavfi "[0:v]scale=1120:630:flags=bicubic,setpts=PTS-STARTPTS[distorted];[1:v]scale=1120:630:flags=bicubic,setpts=PTS-STARTPTS[reference];[distorted][reference]libvmaf=model='path=/home/ubuntu/mediaprocessing/build/models/vmaf_v0.6.1.json':n_subsample=10:n_threads=8" -f null -

ffmpeg -i /efs/test/output_crf_23.mp4 -i /efs/test/output.mp4 -lavfi "[0:v]scale=1280:720:flags=bicubic[distorted];[1:v]scale=1280:720:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=/efs/bench-test/model.json':n_subsample=10:n_threads=8" -f null -

ffmpeg -i /efs/-rgV7miGu3xyUteJhTuE8/chunks/chunk_0.mp4 -i /efs/-rgV7miGu3xyUteJhTuE8/chunks/chunk_0.mp4 -lavfi "[0:v]scale=1080:1080:flags=bicubic[distorted];[1:v]scale=1080:1080:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=/home/ubuntu/mediaprocessing/build/models/vmaf_v0.6.1.json':n_subsample=10:n_threads=8" -f null -
ffmpeg -i /efs/-rgV7miGu3xyUteJhTuE8/chunks/chunk_0.mp4 -i /efs/-rgV7miGu3xyUteJhTuE8/chunks/chunk_0.mp4 -lavfi "[0:v]scale=1080:1080:flags=bicubic[distorted];[1:v]scale=1080:1080:flags=bicubic[reference]" -f null -

ffmpeg -i /efs/-rgV7miGu3xyUteJhTuE8/tmp/chunk_0_1080x1080_25.mp4 -i /efs/-rgV7miGu3xyUteJhTuE8/tmp/chunk_0_1080x1080_25.mp4 -lavfi "[0:v]scale=1080:1080:flags=bicubic[distorted];[1:v]scale=1080:1080:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=/home/ubuntu/mediaprocessing/build/models/vmaf_v0.6.1.json':n_subsample=10:n_threads=8" -f null -
ffmpeg -i test.mp4 -i test.mp4 -lavfi "[0:v]scale=1080:1080:flags=bicubic[distorted];[1:v]scale=1080:1080:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=/home/ubuntu/mediaprocessing/build/models/vmaf_v0.6.1.json':n_subsample=10:n_threads=8" -f null -
ffmpeg -i /efs/-rgV7miGu3xyUteJhTuE8/chunks/chunk_0.mp4 -vf "scale=720:720" test.mp4

ffmpeg -y -i efs/c2qsjwn7q3lno6itw7x7o92fn/output.mp4 -c:v libx264 -c:a aac -movflags faststart -crf 20 -to 5 -vf "crop='if(gte(dar,1/1),if(gt(iw,ih),ih*1/1,ih/(1/1)),iw)':'if(gte(dar,1/1),ih,if(gte(iw,ih),iw/(1/1),iw*1/1))'" efs/c2qsjwn7q3lno6itw7x7o92fn/output1.mp4

ffprobe -v error -select_streams v:0 -show_entries stream=duration,size,width,height,bit_rate -of default=noprint_wrappers=1 efs/sources/test.mov