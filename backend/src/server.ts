import express from "express";
import cors from "cors";
import path from "path";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminPaymentRoutes from "./routes/adminPaymentRoutes.js";
import deliveryRoutes from "./routes/deliveryPlaceRoutes.js";
import adminCustomerRoutes from "./routes/adminCustomerRoutes.js";
import adminAccountRoutes from "./routes/adminAccountRoutes.js";
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/place", deliveryRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/admin/account", adminAccountRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// Test route
app.get("/", (req, res) => {
    res.send("Homemade Food Ordering API is running!");
});
app.get("/api/db-test", async (req, res) => {
    try {
        const connection = await pool.getConnection();

        res.send("Database connected successfully!");

        connection.release();
    } catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).send("Database connection failed!");
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});