import express from "express";
import * as views from "./viewController.js";
import * as auth from "../auth/authController.js";

const router = express.Router();

router.get("/", auth.isLoggedIn, views.getDashboard);
router.get("/reports", auth.isLoggedIn, views.getReports);
router.get("/users", auth.isLoggedIn, views.getusers);
router.get("/signin", auth.isLoggedIn, views.getSignInForm);
router.get("/me", auth.protect, views.getAccount);

export { router as viewRouter };
