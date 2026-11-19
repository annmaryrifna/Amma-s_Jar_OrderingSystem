
import { Router } from "express";

import {getAllOrders, approveOrder,rejectOrder} from "../controllers/adminOrderController.js";


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
export default router;
