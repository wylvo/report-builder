import "dotenv/config";

process.on("uncaughtException", (err) => {
  console.log("UNHANDLED EXCEPTION...");
  console.log(err.name, err.message);
  process.exit(1);
});

import app from "./app.js";

// Instanciating Express' Server & Server Port
const port = process.env.SERVER_PORT || 5050;
const server = app.listen(port, () =>
  console.log(`Server listening on port ${port} at: http://localhost:${port}`)
);

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION...");
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});
