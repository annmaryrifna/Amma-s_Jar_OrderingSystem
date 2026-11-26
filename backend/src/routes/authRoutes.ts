import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
    getCustomerProfile,
    updateCustomerProfile,
    changeCustomerPassword
} from "../controllers/customerAccountController.js";

import { verifyAdmin } from "../middleware/adminMiddleware.js"; const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", verifyToken, (req, res, next) => {
    if ((req as any).user.role !== "customer") {
        return res.status(403).json({
            message: "Customer access only."
        });
    }
    next();
}, getCustomerProfile);

router.put("/profile", verifyToken, (req, res, next) => {
    if ((req as any).user.role !== "customer") {
        return res.status(403).json({
            message: "Customer access only."
        });
    }
    next();
}, updateCustomerProfile);
router.get("/profile", verifyToken, (req, res) => {
    res.status(200).json({
        message: "You are authenticated!",
        user: (req as any).user
    });
});
router.put("/change-password", verifyToken, (req, res, next) => {
    if ((req as any).user.role !== "customer") {
        return res.status(403).json({
            message: "Customer access only."
        });
    }

    next();
}, changeCustomerPassword);
router.get("/admin-test", verifyToken, verifyAdmin, (req, res) => {
    res.status(200).json({
        message: "Welcome Admin! Access granted."
    });
});
export default router;