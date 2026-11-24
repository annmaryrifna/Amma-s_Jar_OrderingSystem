
import { Router } from "express";

import {
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword
} from "../controllers/adminAccountController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

// Get admin profile
router.get(
    "/profile",
    verifyToken,
    verifyAdmin,
    getAdminProfile
);

// Update admin profile
router.put(
    "/profile",
    verifyToken,
    verifyAdmin,
    updateAdminProfile
);

// Change admin password
router.put(
    "/password",
    verifyToken,
    verifyAdmin,
    changeAdminPassword
);

export default router;
