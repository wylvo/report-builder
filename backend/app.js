import path from "path";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import routerV1 from "./api/v1/router.js";
import globalErrorHandler from "./errors/error.controller.js";
import GlobalError from "./errors/globalError.js";
import * as auth from "./auth/auth.controller.js";
import { viewRouter } from "./views/view.router.js";

const app = express();
const __dirname = path.resolve();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/backend/views"));

// Static files
app.use(express.static(path.join(__dirname, "/frontend/public")));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests to the API
const limiter = rateLimit({
  max: 100,
  windowMs: 30000,
  message: "Too many request from this IP, please try again in 30 seconds!",
});
app.use("/api", limiter);

app.use(cors());
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Format JSON responses as text with 2 indented spaces
app.set("json spaces", 2);

// Test middleware
app.use((req, res, next) => {
  console.log(req.cookies);
  next();
});

app.use("/", viewRouter);
app.use("/api/v1", routerV1);
app.post("/signin", auth.validateSignIn, auth.signIn);
app.post("/signout", auth.signOut);

app.all("*", (req, res, next) => {
  next(new GlobalError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
