
import { Router } from "express";
import { submitPayment, getMyPaymentSubmissions } from "../controllers/paymentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
const router = Router();

// Customer payment submission
router.post("/", verifyToken, submitPayment);
router.get("/my-submissions", verifyToken, getMyPaymentSubmissions);
export default router;
