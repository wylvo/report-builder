// Modules
import router from "./router.js";
import * as card from "./api/webhook/card.js";
import * as webhook from "./api/webhook/webhook.js";

// Dependencies
import "dotenv/config";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";

// Node Modules
import path from "path";
const __dirname = path.resolve();

// Instanciating Express' Server & Server Port
const server = express();
const port = process.env.SERVER_PORT || 5050;

// Static Files
server.use(express.static(path.join(__dirname, "/frontend/public")));

// JSON Formats & Headers Compression, Security (Helmet) & CORS Headers
server.use(express.json({ limit: "50mb" }));
server.use(compression());
server.use(helmet());
server.use(cors());
server.use("/api", router);

server.post("/signin");

// Format Json Responses As Text With Spaces
server.set("json spaces", 2);

// Post Report Data To Webhook URL Endpoint
server.post("/api/send");

// Listen On Specified Port Number
server.listen(port, () =>
  console.log(`Server listening on port ${port} at: http://localhost:${port}`)
);
