
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { FormEvent } from "react";
import API from "../services/api";
import "./css/Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");

        if (!email.trim() || !password) {
            setMessage("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await API.post("/auth/login", {
                email: email.trim().toLowerCase(),
                password,
            });

            const { token, user } = response.data;

            if (!token || !user?.role) {
                setMessage("Invalid login response. Please try again.");
                return;
            }

            sessionStorage.setItem("token", token);
            sessionStorage.setItem("user", JSON.stringify(user));
            console.log("Logged-in user:", user);
            if (user.role === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/customer/dashboard");
            }

        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to login. Please check your details."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <Link to="/" className="login-brand">
                    Amma's Secrete Jar
                </Link>

                <h1>Welcome Back!</h1>

                <p className="login-subtitle">
                    Sign in to enjoy your favourite homemade treats.
                </p>

                <form onSubmit={handleLogin}>

                    <div className="login-field">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">Password</label>

                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <p className="login-message" role="alert">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Login"}
                    </button>

                </form>

                <p className="register-link">
                    Don't have an account?{" "}
                    <Link to="/register">Create an Account</Link>
                </p>

                <Link to="/" className="back-home">
                    Back to Home
                </Link>

            </div>
        </div>
    );
}

export default Login;
