import path from "path";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import routerV1 from "./api/v1/router.js";
import globalErrorHandler from "./errors/errorController.js";
import { signIn } from "./signin.js";

const app = express();
const __dirname = path.resolve();

// Set Security HTTP headers
app.use(helmet());

// Limit requests to the api
const limiter = rateLimit({
  max: 100,
  windowMs: 15000,
  message: "Too many request from this IP, please try again in 15 seconds!",
});
app.use("/api", limiter);

app.use(cors());
app.use(compression());
app.use(express.json({ limit: "50mb" }));

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// Format Json Responses As Text With Spaces
app.set("json spaces", 2);

// Static Files
app.use(express.static(path.join(__dirname, "/frontend/public")));

app.use("/api/v1", routerV1);
app.post("/signin", signIn);

app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

app.use(globalErrorHandler);

export default app;
