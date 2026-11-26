
import { useEffect, useState } from "react";
import API from "../services/api";



function AdminAccountSection() {


    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");

    const fetchProfile = async () => {
        try {
            const response = await API.get("/admin/account/profile");

            const admin = response.data.profile;

          
            setName(admin.name);
            setEmail(admin.email);
            setPhone(admin.phone || "");
        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to load admin profile."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        try {
            setSavingProfile(true);

            const response = await API.put("/admin/account/profile", {
                name,
                email,
                phone
            });

          
            setMessage(response.data.message);
        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to update admin profile."
            );
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage("");

        try {
            setSavingPassword(true);

            const response = await API.put("/admin/account/password", {
                currentPassword,
                newPassword,
                confirmPassword
            });

            setPasswordMessage(response.data.message);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setPasswordMessage(
                error.response?.data?.message ||
                "Unable to change password."
            );
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return <p>Loading admin account...</p>;
    }

    return (
        <div className="admin-account-section">
            <div className="settings-section-heading">
                <h3>Admin Account</h3>
                <p>Manage your profile details and login password.</p>
            </div>

            <div className="admin-account-card">
                <h4>Profile Information</h4>

                <form onSubmit={handleProfileUpdate} className="settings-form">
                    <div className="settings-field">
                        <label>Admin Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="settings-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="settings-field">
                        <label>Contact Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter contact number"
                        />
                    </div>

                    <button
                        type="submit"
                        className="settings-save-button"
                        disabled={savingProfile}
                    >
                        {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                </form>

                {message && <p className="capacity-message">{message}</p>}
            </div>

            <div className="admin-account-card">
                <h4>Change Password</h4>

                <form onSubmit={handlePasswordUpdate} className="settings-form">
                    <div className="settings-field">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="settings-field">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="settings-field">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="settings-save-button"
                        disabled={savingPassword}
                    >
                        {savingPassword ? "Updating..." : "Update Password"}
                    </button>
                </form>

                {passwordMessage && (
                    <p className="capacity-message">{passwordMessage}</p>
                )}
            </div>
        </div>
    );
}

export default AdminAccountSection;
