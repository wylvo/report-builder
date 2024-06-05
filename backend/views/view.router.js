import express from "express";
import * as views from "./view.controller.js";
import * as auth from "../auth/auth.controller.js";

const router = express.Router();

// Render unprotected template view
// Error view templates will not be rendered
router.get("/signin", auth.isLoggedIn, views.getSignInForm);

// Protect all routes after this middleware
router.use(auth.protect);

// Render protected template views
router.get("/", views.getDashboard);
router.get("/reports", views.getReports);
router.get("/users", views.getUsers);
router.get("/account", views.getAccount);

export { router as viewRouter };
