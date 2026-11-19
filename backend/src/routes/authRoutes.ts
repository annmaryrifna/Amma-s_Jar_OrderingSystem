import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

import { verifyAdmin } from "../middleware/adminMiddleware.js"; const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", verifyToken, (req, res) => {
    res.status(200).json({
        message: "You are authenticated!",
        user: (req as any).user
    });
});

router.get("/admin-test", verifyToken, verifyAdmin, (req, res) => {
    res.status(200).json({
        message: "Welcome Admin! Access granted."
    });
});
export default router;