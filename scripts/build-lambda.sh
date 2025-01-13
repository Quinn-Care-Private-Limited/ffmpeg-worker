rm -rf dist
esbuild src/lambda/ffmpeg.ts --bundle --minify --sourcemap --platform=node --target=es2020 --outfile=dist/ffmpeg.js
esbuild src/lambda/files.ts --bundle --minify --sourcemap --platform=node --target=es2020 --outfile=dist/files.js
esbuild src/lambda/storage.ts --bundle --minify --sourcemap --platform=node --target=es2020 --outfile=dist/storage.js
cp -r src/handlers/*.json dist/ 
cd dist
zip -r ffmpeg.zip ffmpeg.js* vmaf_*.json
zip -r files.zip files.js*
zip -r storage.zip storage.js*
rm *.js *.map *.json
