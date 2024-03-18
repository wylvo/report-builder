import path from "path";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import routerV1 from "./api/v1/router.js";
import globalErrorHandler from "./api/errors/errorController.js";
import GlobalError from "./api/errors/globalError.js";
import { signIn } from "./auth.js";

const app = express();
const __dirname = path.resolve();

// Set security HTTP headers
app.use(helmet());

// Limit requests to the API
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

// Format JSON responses as text with 2 indented spaces
app.set("json spaces", 2);

// Static files
app.use(express.static(path.join(__dirname, "/frontend/public")));

app.use("/api/v1", routerV1);
app.post("/signin", signIn);

app.all("*", (req, res, next) => {
  next(new GlobalError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
