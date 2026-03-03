import { Router } from "express";
import { signup, login, refresh, logout, getCsrf } from "../../controllers/auth/auth.controller";
import { getMe } from "../../controllers/auth/me.controller";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { requireCsrf } from "../../middlewares/csrf.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { loginSchema, refreshSchema, signupSchema } from "../../validators/auth.validator";

const router = Router();

// Public routes
router.post("/signup", validate({ body: signupSchema }), signup);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/refresh", validate({ body: refreshSchema }), refresh);

// Protected route
router.get("/me", authenticate, getMe);
router.get("/csrf", authenticate, getCsrf);
router.post("/logout", authenticate, requireCsrf, logout);

export default router;
