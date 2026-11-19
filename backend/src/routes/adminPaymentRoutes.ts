
import { Router } from "express";

import {
    getAllPaymentSubmissions,
    verifyPayment,
    rejectPayment
} from "../controllers/adminPaymentController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

// View all customer payment submissions
router.get("/", verifyToken, verifyAdmin, getAllPaymentSubmissions);

// Verify a customer payment
router.put("/:paymentId/verify", verifyToken, verifyAdmin, verifyPayment);

// Reject a customer payment
router.put("/:paymentId/reject", verifyToken, verifyAdmin, rejectPayment);

export default router;
