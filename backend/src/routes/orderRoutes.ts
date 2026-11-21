
import { Router } from "express";
import {
    createOrder,
    getCustomerOrders,
    getDeliveryAreasByPincode,
} from "../controllers/orderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", verifyToken, createOrder);
router.get("/my-orders", verifyToken, getCustomerOrders);
router.get(
    "/delivery-areas/:pincode",
    verifyToken,
    getDeliveryAreasByPincode
);

export default router;
