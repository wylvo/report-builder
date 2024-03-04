import "dotenv/config";

import config from "./config/config.js";

process.on("uncaughtException", (err) => {
  console.log("UNHANDLED EXCEPTION...");
  console.log(err.name, err.message);
  process.exit(1);
});

import app from "./app.js";

const server = app.listen(config.port, () =>
  console.log(
    `Server listening on port ${config.port} at: http://localhost:${config.port}`
  )
);

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION...");
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});
