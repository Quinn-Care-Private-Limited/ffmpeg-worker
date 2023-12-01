import fs from "fs";

export function createDirectoryIfNotExists(path: string) {
  if (!checkFileIfExists(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

export function deleteFileIfExists(path: string) {
  if (checkFileIfExists(path)) {
    fs.unlinkSync(path);
  }
}

export function deleteDirectoryIfExists(path: string) {
  if (checkFileIfExists(path)) {
    fs.rmdirSync(path, { recursive: true });
  }
}

export function checkFileIfExists(path: string) {
  return fs.existsSync(path);
}

export function getFilesInDirectory(path: string) {
  return fs.readdirSync(path);
}

export function createFile(path: string, data: string) {
  createDirectoryIfNotExists(path);
  fs.writeFileSync(path, data);
}

export async function readFile(path: string) {
  return new Promise<Buffer>((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        reject();
      }
      resolve(data);
    });
  });
}
