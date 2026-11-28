
import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/adminMiddleware.js";

import {
    submitProductReview,getMyProductReviews,getAllProductReviews, updateProductReviewStatus, getApprovedProductReviews,
} from "../controllers/reviewController.js";

const router = Router();

// Customer routes
router.post("/", verifyToken, submitProductReview);
router.get("/my-reviews", verifyToken, getMyProductReviews);

// Admin routes
router.get(
    "/admin/all",
    verifyToken,
    verifyAdmin,
    getAllProductReviews
);

router.put(
    "/admin/:reviewId",
    verifyToken,
    verifyAdmin,
    updateProductReviewStatus
);
router.get("/approved", getApprovedProductReviews);
export default router;

