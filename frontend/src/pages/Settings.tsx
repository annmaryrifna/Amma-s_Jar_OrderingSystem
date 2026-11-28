
import { useLocation } from "react-router-dom";
import "./css/Settings.css";
import AdminAccountSection from "./AdminAccountSection";

function Settings() {
    const location = useLocation();

    const section =
        location.state?.section === "password" ? "password" : "profile";

    return (
        <div className="settings-page">

            <div className="settings-page-header">
                <h2>
                    {section === "password"
                        ? "Change Password"
                        : "My Profile"}
                </h2>

                <p>
                    {section === "password"
                        ? "Update your admin account password."
                        : "Manage your admin profile information."}
                </p>
            </div>

            <section className="settings-section admin-account-container">
                <AdminAccountSection section={section} />
            </section>

        </div>
    );
}

export default Settings;
