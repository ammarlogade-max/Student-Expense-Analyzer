import { Router } from "express";
import {
  adminActivity,
  adminLogin,
  adminMl,
  adminOverview,
  adminSystem,
  adminUsers
} from "../../controllers/admin/admin.controller";
import { authenticateAdmin } from "../../middlewares/auth/admin.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  adminLoginSchema,
  paginationSchema
} from "../../validators/admin.validator";

const router = Router();

router.post("/login", validate({ body: adminLoginSchema }), adminLogin);
router.get("/overview", authenticateAdmin, adminOverview);
router.get("/users", authenticateAdmin, validate({ query: paginationSchema }), adminUsers);
router.get("/activity", authenticateAdmin, validate({ query: paginationSchema }), adminActivity);
router.get("/ml", authenticateAdmin, validate({ query: paginationSchema }), adminMl);
router.get("/system", authenticateAdmin, adminSystem);

export default router;
