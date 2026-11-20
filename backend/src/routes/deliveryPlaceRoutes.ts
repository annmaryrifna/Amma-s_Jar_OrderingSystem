import express from "express";
import verifyToken from "../middleware/authMiddleware.js";
import verifyAdmin from "../middleware/adminMiddleware.js";
import {
    getDeliveryManagementData,
    addDeliveryArea,
    updateDeliveryArea,
    updateDeliveryAreaStatus,
    updateDeliverySettings,
} from "../controllers/deliveryPlaceController.js";

const router = express.Router();

// All delivery-management endpoints are restricted to admins.
router.use(verifyToken, verifyAdmin);

router.get("/", getDeliveryManagementData);
router.post("/areas", addDeliveryArea);
router.put("/areas/:areaId", updateDeliveryArea);
router.patch("/areas/:areaId/status", updateDeliveryAreaStatus);
router.put("/settings", updateDeliverySettings);

export default router;
