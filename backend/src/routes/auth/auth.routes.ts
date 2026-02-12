import { Router } from "express";
import { signup, login, refresh, logout } from "../../controllers/auth/auth.controller";
import { getMe } from "../../controllers/auth/me.controller";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { loginSchema, refreshSchema, signupSchema } from "../../validators/auth.validator";

const router = Router();

// Public routes
router.post("/signup", validate({ body: signupSchema }), signup);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/refresh", validate({ body: refreshSchema }), refresh);

// Protected route
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
