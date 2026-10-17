import { Router } from "express";

import { optionalAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { authController } from "@/modules/auth/auth.controller";
import { connectPatSchema } from "@/modules/auth/auth.schema";

export const authRouter = Router();

authRouter.get("/github", authController.redirectToGitHub);
authRouter.get("/github/callback", authController.handleOAuthCallback);
authRouter.post("/pat", validate(connectPatSchema, "body"), authController.connectWithPersonalAccessToken);
authRouter.get("/me", optionalAuth, authController.getCurrentUser);
authRouter.post("/logout", authController.logout);
