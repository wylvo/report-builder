import express from "express";
import * as views from "./view.controller.js";
import * as auth from "../auth/auth.controller.js";

const router = express.Router();

// Render protected template views
router.get("/", auth.protect, views.getDashboard);
router.get("/reports", auth.protect, views.getReports);
router.get("/users", auth.protect, views.getUsers);
router.get("/account", auth.protect, views.getAccount);

// Render protected template view but without rendering error templates
router.get("/signin", auth.isLoggedIn, views.getSignInForm);

export { router as viewRouter };
