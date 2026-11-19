
import { Router } from "express";
import { createOrder, getCustomerOrders } from "../controllers/orderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", verifyToken, createOrder);
router.get("/my-orders", verifyToken, getCustomerOrders);

export default router;
