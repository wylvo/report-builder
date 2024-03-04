import path from "path";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import router from "./router.js";

const app = express();
const __dirname = path.resolve();

// Set Security HTTP headers
app.use(helmet());

// Limit requests to the api
const limiter = rateLimit({
  max: 100,
  windowMs: 15000,
  message: "Too many request from this IP, please try again in an hour!",
});
app.use("/api", limiter);

app.use(cors());
app.use(compression());
app.use(express.json({ limit: "50mb" }));

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1", router);

// Format Json Responses As Text With Spaces
app.set("json spaces", 2);

// Post Report Data To Webhook URL Endpoint
app.post("/api/send");

// Static Files
app.use(express.static(path.join(__dirname, "/frontend/public")));

export default app;
