import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
    submitComplaint,
    getMyComplaints,
} from "../controllers/complaintController.js";

const router = Router();

router.post("/", verifyToken, submitComplaint);
router.get("/my-complaints", verifyToken, getMyComplaints);
export default router;