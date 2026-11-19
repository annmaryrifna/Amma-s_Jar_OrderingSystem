
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import API from "../services/api";
import "./css/Register.css";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phonePattern = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!name.trim() || !email.trim() || !phone.trim() ||
            !password || !confirmPassword) {
            setError("All fields are required.");
            return;
        }

        if (!emailPattern.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!phonePattern.test(phone.trim())) {
            setError("Enter a valid Indian mobile number.");
            return;
        }

        if (!passwordPattern.test(password)) {
            setError(
                "Password must contain at least 6 characters, including a letter and a number."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const response = await API.post("/auth/register", {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                password
            });

            setMessage(
                response.data.message || "Account created successfully!"
            );

            setTimeout(() => {
                navigate("/login");
            }, 1200);

        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="register-page">

            <Link to="/" className="register-brand">
                Amma's <strong>Secrete Jar.</strong>
            </Link>

            <div className="register-container">

                <div className="register-heading">
                    <span className="register-eyebrow">WELCOME TO OUR KITCHEN</span>
                    <h1>Create Your Account</h1>
                    <p>Join us and enjoy homemade goodness.</p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">

                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter your phone number"
                            autoComplete="tel"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="password-input">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label="Toggle confirm password visibility"
                            >
                                {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                            </button>
                        </div>
                    </div>

                    {error && <p className="register-error">{error}</p>}
                    {message && <p className="register-success">{message}</p>}

                    <button
                        type="submit"
                        className="register-submit"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>

                </form>

                <p className="register-login">
                    Already have an account? <Link to="/login">Login</Link>
                </p>

                <Link to="/" className="back-home">
                    Back to Home
                </Link>

            </div>
        </div>
    );
}

export default Register;
