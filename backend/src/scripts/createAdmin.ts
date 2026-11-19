import bcrypt from "bcrypt";
import pool from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const createAdmin = async () => {
    try {
        const name = process.env.ADMIN_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error("Admin details are missing in .env");
        }

        const [existingUsers]: any = await pool.execute(
            "SELECT id FROM users WHERE role = 'admin'"
        );

        if (existingUsers.length > 0) {
            console.log("Admin account already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.execute(
            `INSERT INTO users (name, email, password, role)
             VALUES (?, ?, ?, 'admin')`,
            [name, email, hashedPassword]
        );

        console.log("Admin account created successfully!");

    } catch (error) {
        console.error("Admin creation failed:", error);
    } finally {
        await pool.end();
    }
};

createAdmin();