import express from "express";
import * as views from "./viewController.js";
import * as auth from "../auth.js";

const router = express.Router();

router.get("/", auth.protect, views.getMainPage);
router.get("/signin", auth.isLoggedIn, views.getSignInForm);

export { router as viewRouter };
