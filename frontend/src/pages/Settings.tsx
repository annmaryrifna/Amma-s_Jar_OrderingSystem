
import { useState } from "react";
import "./css/Settings.css";
import AdminAccountSection from "./AdminAccountSection";

function Settings() {
    const [storeName, setStoreName] = useState("Amma's Secret Jar");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState(
        "Thuthiyoor, Kakkanad, Ernakulam, Kerala"
    );

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Store information form is ready. Database connection will be added next.");
    };

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
