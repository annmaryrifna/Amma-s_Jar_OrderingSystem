
import { Router } from "express";
import {
    createOrder,
    getCustomerOrders,
    getDeliveryAreasByPincode,
    getAllDeliveryAreas,
    cancelCustomerOrder
} from "../controllers/orderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", verifyToken, createOrder);
router.get("/my-orders", verifyToken, getCustomerOrders);
router.put(
    "/:orderId/cancel",
    verifyToken,
    cancelCustomerOrder
);
// Get all active delivery localities
router.get(
    "/delivery-areas",
    verifyToken,
    getAllDeliveryAreas
);

// Get delivery localities by PIN code
router.get(
    "/delivery-areas/:pincode",
    verifyToken,
    getDeliveryAreasByPincode
);
export default router;
