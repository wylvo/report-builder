import express from "express";

import * as user from "../userController.js";

const router = express.Router();

router.post("/", user.resetUserPassword);

export { router as resetPasswordRouter };
