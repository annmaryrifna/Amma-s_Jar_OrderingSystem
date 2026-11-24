
import { Router } from "express";

import {
    getAllOrders,
    approveOrder,
    rejectOrder,
    updateOrderStatus,
    getDailyCapacityLimit,
    updateDailyCapacityLimit
} from "../controllers/adminOrderController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

// Admin: View all customer bookings
router.get(
    "/",
    verifyToken,
    verifyAdmin,
    getAllOrders
);

// Admin: Approve a customer booking
router.put(
    "/:orderId/approve",
    verifyToken,
    verifyAdmin,
    approveOrder
);
router.put(
    "/:orderId/reject",
    verifyToken,
    verifyAdmin,
    rejectOrder
);
// Admin: Update order preparation and delivery status
router.put(
    "/:orderId/status",
    verifyToken,
    verifyAdmin,
    updateOrderStatus
);
// Admin: View daily booking limit
router.get(
    "/capacity",
    verifyToken,
    verifyAdmin,
    getDailyCapacityLimit
);

// Admin: Update daily booking limit
router.put(
    "/capacity",
    verifyToken,
    verifyAdmin,
    updateDailyCapacityLimit
);

export default router;
