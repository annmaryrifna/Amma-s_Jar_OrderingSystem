
import { useEffect, useState } from "react";
import API from "../services/api";
import "./css/DailyCapacityLimit.css";

interface CapacitySettings {
    setting_id: number;
    daily_booking_limit: number;
    updated_at: string;
}

function DailyCapacityLimit() {
    const [settings, setSettings] = useState<CapacitySettings | null>(null);
    const [limit, setLimit] = useState("3");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const fetchCapacity = async () => {
        try {
            const response = await API.get("/admin/orders/capacity");

            setSettings(response.data.settings);
            setLimit(String(response.data.settings.daily_booking_limit));
        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to load daily booking limit."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCapacity();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        const value = Number(limit);

        if (!Number.isInteger(value) || value < 1 || value > 100) {
            setMessage("Enter a whole number between 1 and 100.");
            return;
        }

        try {
            setSaving(true);

            const response = await API.put("/admin/orders/capacity", {
                daily_booking_limit: value
            });

            setMessage(response.data.message);
            await fetchCapacity();
        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to update daily booking limit."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="capacity-page">Loading settings...</div>;
    }

    return (
        <div className="capacity-page">
            <div className="capacity-page-header">
                <h2>Daily Capacity Limit</h2>
                <p className="moveway">Manage the maximum number of accepted bookings per day.</p>
            </div>

            <div className="capacity-card">
                <div className="capacity-card-heading">
                    <h3>Daily Booking Capacity</h3>
                </div>

                <div className="capacity-current">
                    <span>Current Daily Limit</span>
                    <h1>{settings?.daily_booking_limit ?? 0}</h1>
                    <p>Bookings per day</p>
                </div>

                <form onSubmit={handleSave} className="capacity-form">
                    <label htmlFor="dailyLimit">
                        Change Daily Booking Limit
                    </label>

                    <input
                        id="dailyLimit"
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </form>

                {message && (
                    <p className="capacity-message">{message}</p>
                )}

                <div className="capacity-note">
                    <h4>How the daily limit works</h4>
                    <ul>
                        <li>Pending booking requests do not count.</li>
                        <li>Approved, Confirmed and Completed bookings count.</li>
                        <li>Admin can override the limit when approving an additional booking.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default DailyCapacityLimit;
