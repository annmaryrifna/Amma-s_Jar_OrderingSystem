
import { Router } from "express";
import {
    submitPayment,
    getMyPaymentSubmissions,
    updateBalancePaymentPreference
} from "../controllers/paymentController.js"; 
import { verifyToken } from "../middleware/authMiddleware.js";
const router = Router();

// Customer payment submission
router.post("/", verifyToken, submitPayment);
router.get("/my-submissions", verifyToken, getMyPaymentSubmissions);
// Customer balance payment preference
router.put(
    "/balance-preference",
    verifyToken,
    updateBalancePaymentPreference
);
export default router;
