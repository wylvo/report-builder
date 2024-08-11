import express from "express";

import * as auth from "./auth.controller.js";
import responseInterceptor from "../responseInterceptor/responseInterceptor.js";

const router = express.Router();

router.use(responseInterceptor.auth);

router.post("/signin", auth.validateSignIn, auth.signIn);
router.post("/signout", auth.signOut);

export default router;
