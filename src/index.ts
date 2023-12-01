import express from "express";
import { EventEmitter } from "events";
import { mainRoute } from "routes/main.routes";

EventEmitter.setMaxListeners(0);
console.log("Starting FFmpeg Worker server");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", mainRoute);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use((req, res) => {
  res.status(404).send("Not found");
});

app.listen(port, () => {
  console.log(`Server started in ${process.env.NODE_ENV || "production"} mode on port ${port}`);
});
