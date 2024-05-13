import express from "express";
import * as views from "./viewController.js";
import * as auth from "../auth/authController.js";

const router = express.Router();

router.get("/", auth.protect, views.getDashboard);
router.get("/reports", auth.protect, views.getReports);
router.get("/users", auth.protect, views.getusers);
router.get("/signin", auth.isLoggedIn, views.getSignInForm);
router.get("/me", auth.protect, views.getAccount);

export { router as viewRouter };
