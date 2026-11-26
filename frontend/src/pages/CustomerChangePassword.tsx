
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import "./css/CustomerChangePassword.css";
import CustomerSettingsMenu from "./CustomerSettingsMenu";

function CustomerChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            alert("New password and confirmation do not match.");
            return;
        }

        if (newPassword.length < 8) {
            alert("New password must contain at least 8 characters.");
            return;
        }

        try {
            setSaving(true);

            const response = await API.put("/auth/change-password", {
                currentPassword,
                newPassword,
                confirmPassword,
            });

            alert(response.data.message);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Password change error:", error);
            alert(
                error.response?.data?.message ||
                "Unable to change password."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="customer-change-password-page">
            <header className="change-password-header">
                <Link to="/customer/dashboard" className="change-password-brand">
                    Amma's Secrete Jar
                </Link>

                <nav className="customer-nav">
                    <Link to="/customer/dashboard">Home</Link>
                    <Link to="/shop">Shop</Link>
                    <Link to="/customer/orders">My Orders</Link>
                    <CustomerSettingsMenu />
                </nav>

            </header>

            <main className="change-password-content">
                <section className="change-password-card">
                    <div className="change-password-heading">
                        <h1>Change Password</h1>
                        <p>Keep your account secure with a new password.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="change-password-field">
                            <label htmlFor="current-password">Current Password</label>
                            <input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="change-password-field">
                            <label htmlFor="new-password">New Password</label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="change-password-field">
                            <label htmlFor="confirm-password">Confirm New Password</label>
                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="change-password-submit"
                            disabled={saving}
                        >
                            {saving ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
}

export default CustomerChangePassword;
