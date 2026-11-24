
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import "./css/CustomerProfile.css";

interface CustomerProfileData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
}

function CustomerProfile() {
    const [profile, setProfile] = useState<CustomerProfileData | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await API.get("/auth/profile");
            const customer = response.data.profile;

            setProfile(customer);
            setName(customer.name);
            setEmail(customer.email);
            setPhone(customer.phone ?? "");
        } catch (error) {
            console.error("Unable to load profile:", error);
            alert("Unable to load your profile. Please login again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setSaving(true);

            const response = await API.put("/auth/profile", {
                name,
                email,
                phone,
            });

            const updatedProfile = response.data.profile;

            setProfile(updatedProfile);
            setName(updatedProfile.name);
            setEmail(updatedProfile.email);
            setPhone(updatedProfile.phone ?? "");
            setEditing(false);

            alert("Profile updated successfully.");
        } catch (error: any) {
            console.error("Profile update error:", error);
            alert(
                error.response?.data?.message ||
                "Unable to update your profile."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="customer-profile-page">Loading profile...</div>;
    }

    if (!profile) {
        return (
            <div className="customer-profile-page">
                <p>Profile information is unavailable.</p>
                <Link to="/customer/dashboard">Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="customer-profile-page">
            <header className="profile-page-header">
                <Link to="/customer/dashboard" className="profile-brand">
                    Amma's Secrete Jar
                </Link>
                <Link to="/customer/dashboard" className="profile-back-link">
                    Back to Dashboard
                </Link>
            </header>

            <main className="profile-content">
                <section className="profile-card">
                    <div className="profile-card-heading">
                        <h1>My Profile</h1>
                        <p>View and manage your personal information.</p>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="profile-form-group">
                            <label htmlFor="profile-name">Full Name</label>
                            <input
                                id="profile-name"
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                disabled={!editing}
                                required
                                maxLength={100}
                            />
                        </div>

                        <div className="profile-form-group">
                            <label htmlFor="profile-email">Email Address</label>
                            <input
                                id="profile-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                disabled={!editing}
                                required
                                maxLength={150}
                            />
                        </div>

                        <div className="profile-form-group">
                            <label htmlFor="profile-phone">Phone Number</label>
                            <input
                                id="profile-phone"
                                type="tel"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                disabled={!editing}
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div className="profile-actions">
                            {editing ? (
                                <>
                                    <button
                                        type="submit"
                                        className="profile-save-button"
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>

                                    <button
                                        type="button"
                                        className="profile-cancel-button"
                                        onClick={() => {
                                            setName(profile.name);
                                            setEmail(profile.email);
                                            setPhone(profile.phone ?? "");
                                            setEditing(false);
                                        }}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="profile-edit-button"
                                    onClick={() => setEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}

export default CustomerProfile;
