
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, UserRound, LockKeyhole, LogOut } from "lucide-react";
import "./css/CustomerSettingsMenu.css";
function CustomerSettingsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("cart");
        navigate("/login", { replace: true });
    };

    return (
        <div className="customer-settings-menu" ref={menuRef}>
            <button
                type="button"
                className="customer-settings-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Customer settings"
                aria-expanded={isOpen}
            >
                <Settings size={21} />
            </button>

            {isOpen && (
                <div className="customer-settings-dropdown">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            navigate("/customer/profile");
                        }}
                    >
                        <UserRound size={17} />
                        My Profile
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            navigate("/customer/change-password");
                        }}
                    >
                        <LockKeyhole size={17} />
                        Change Password
                    </button>

                    <button
                        type="button"
                        className="customer-logout-option"
                        onClick={handleLogout}
                    >
                        <LogOut size={17} />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

export default CustomerSettingsMenu;
