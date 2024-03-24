import express from "express";
import { getMainPage, getSignInForm } from "./viewController.js";

const router = express.Router();

router.get("/", getMainPage);
router.get("/signin", getSignInForm);

export { router as viewRouter };
