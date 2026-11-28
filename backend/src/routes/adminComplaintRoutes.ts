import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/adminMiddleware.js";
import {
    getAllComplaints,
    updateComplaint,
} from "../controllers/adminComplaintController.js";

const router = Router();

router.get("/", verifyToken, verifyAdmin, getAllComplaints);

router.put("/:complaintId", verifyToken, verifyAdmin, updateComplaint);

export default router;