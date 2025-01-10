rm -rf dist
esbuild src/lambda/index.ts --bundle --minify --sourcemap --platform=node --target=es2020 --outfile=dist/index.js
cp -r src/models dist/ 
cd dist && zip -r lambda.zip *
