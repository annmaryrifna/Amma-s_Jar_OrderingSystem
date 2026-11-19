import { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, password } = req.body;

        // 1. Check required fields
        if (
            !name?.trim() ||
            !email?.trim() ||
            !phone?.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.trim();

        // 2. Validate name
        if (cleanName.length > 100) {
            return res.status(400).json({
                message: "Name cannot exceed 100 characters."
            });
        }

        // 3. Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        // 4. Validate Indian mobile number
        const phonePattern = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

        if (!phonePattern.test(cleanPhone)) {
            return res.status(400).json({
                message: "Please enter a valid Indian mobile number."
            });
        }

        // 5. Validate password
        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

        if (!passwordPattern.test(password)) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters, including a letter and a number."
            });
        }

        // 6. Check whether email already exists
        const [existingUsers]: any = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        // 7. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 8. Insert customer into database
        const [result]: any = await db.query(
            `INSERT INTO users
            (name, email, phone, password, role)
            VALUES (?, ?, ?, ?, ?)`,
            [
                cleanName,
                cleanEmail,
                cleanPhone,
                hashedPassword,
                "customer"
            ]
        );

        return res.status(201).json({
            message: "Registration successful!",
            user_id: result.insertId
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find customer by email
        const [users]: any = await pool.execute(
            "SELECT * FROM users WHERE email = ? AND is_active = TRUE",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        // Compare entered password with stored hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET as string,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};