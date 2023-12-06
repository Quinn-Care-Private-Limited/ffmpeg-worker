#! /usr/bin/env node

const { program } = require("commander");
const path = require("path");
const process = require("process");
const fs = require("fs");

program.command("create-env").description("Create a env file").action(createEnvFile);
program.command("start").description("Start ffmpeg worker server").action(start);
program.command("stop").description("Stop ffmpeg worker server").action(stop);
program.command("tail").description("Tail logs of ffmpeg worker server").action(tail);
program.command("clean-log").description("Clean logs of ffmpeg worker server").action(cleanLog);

async function createEnvFile() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const cwd = process.cwd();

  const question = (question) => {
    return new Promise((resolve, reject) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  };

  let data;

  let envfile = await question("Enter env file name (default .env): ");
  envfile = envfile.trim();
  if (!envfile) envfile = ".env";
  fs.writeFileSync(`${cwd}/${envfile}`, "");

  const provider = await question("Enter provider AWS/GCP: ");
  if (provider === "AWS") {
    fs.appendFileSync(`${cwd}/${envfile}`, `CLOUD_STORAGE=S3\n`);
    const vars = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"];
    for (let v of vars) {
      data = await question(`Enter ${v}: `);
      fs.appendFileSync(`${cwd}/${envfile}`, `${v}=${data}\n`);
    }
  } else if (provider === "GCP") {
  } else {
    console.log("Invalid provider");
    rl.close();
  }

  const vars = ["PORT", "FS_PATH", "CLIENT_ID", "CLIENT_SECRET"];

  for (let v of vars) {
    data = await question(`Enter ${v}: `);
    fs.appendFileSync(`${cwd}/${envfile}`, `${v}=${data}\n`);
  }

  rl.close();
}

function start() {
  const forever = require("forever");
  const dotenv = require("dotenv");
  const cwd = process.cwd();
  dotenv.config(cwd + "/.env");

  const scriptPath = path.join(__dirname, "..", "build", "index.js");
  forever.startDaemon(scriptPath, {
    max: 1,
    silent: false,
    uid: "ffmpeg-worker",
  });
  console.log("ffmpeg worker started");
}

function stop() {
  const forever = require("forever");
  try {
    forever.stop("ffmpeg-worker");
    console.log("ffmpeg worker stopped");
  } catch (e) {
    console.log("ffmpeg worker not running");
  }
}

function tail() {
  const forever = require("forever");
  try {
    //get log file path
    const logFile = forever.logFilePath("ffmpeg-worker") + ".log";
    //tail log file
    console.log(fs.readFileSync(logFile, "utf8"));
  } catch (e) {
    console.log("ffmpeg worker log file not found");
  }
}

function cleanLog() {
  const forever = require("forever");
  try {
    //get log file path
    const logFile = forever.logFilePath("ffmpeg-worker") + ".log";
    //clean log file
    fs.writeFileSync(logFile, "");
    console.log("ffmpeg worker log file cleaned");
  } catch (e) {
    console.log("ffmpeg worker log file not found");
  }
}

program.parse();
