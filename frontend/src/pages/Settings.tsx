
import "./css/Settings.css";
import AdminAccountSection from "./AdminAccountSection";

function Settings() {
    return (
        <div className="settings-page">
            <div className="settings-page-header">
                <h2>Settings</h2>
                <p>Manage your store preferences and business information.</p>
            </div>

            <section className="settings-section admin-account-container">
                <AdminAccountSection />
            </section>
        </div>
    );
}

export default Settings;
