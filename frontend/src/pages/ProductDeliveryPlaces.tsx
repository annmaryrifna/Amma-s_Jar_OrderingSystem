import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
    Search,
    Plus,
    Pencil,
    MapPin,
    Truck,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Save,
    X,
} from "lucide-react";
import API from "../services/api";
import "./css/ProductDeliveryPlaces.css";

type DeliveryArea = {
    area_id: number;
    area_name: string;
    pincode: string;
    delivery_charge: number | string;
    is_active: number | boolean;
    created_at?: string;
    updated_at?: string;
};

type DeliverySettings = {
    setting_id: number;
    pickup_location: string;
    max_delivery_distance: number | string;
    delivery_enabled: number | boolean;
    updated_at?: string;
};

type AreaForm = {
    area_name: string;
    pincode: string;
    delivery_charge: string;
    is_active: boolean;
};

const emptyAreaForm: AreaForm = {
    area_name: "",
    pincode: "",
    delivery_charge: "30",
    is_active: true,
};

const isEnabled = (value: number | boolean) => value === true || value === 1;

function ProductDelivery() {
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [settings, setSettings] = useState<DeliverySettings | null>(null);
    const [settingsForm, setSettingsForm] = useState({
        pickup_location: "",
        max_delivery_distance: "15",
        delivery_enabled: true,
    });
    const [areaForm, setAreaForm] = useState<AreaForm>(emptyAreaForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [savingArea, setSavingArea] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await API.get("/admin/place");
            const loadedAreas: DeliveryArea[] = response.data.areas || [];
            const loadedSettings: DeliverySettings = response.data.settings;
            setAreas(loadedAreas);
            setSettings(loadedSettings);
            setSettingsForm({
                pickup_location: loadedSettings.pickup_location || "",
                max_delivery_distance: String(loadedSettings.max_delivery_distance ?? 15),
                delivery_enabled: isEnabled(loadedSettings.delivery_enabled),
            });
        } catch (err: any) {
            setError(err.response?.data?.message || "Unable to load delivery information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filteredAreas = useMemo(() => {
        const searchText = search.trim().toLowerCase();
        return areas.filter((area) => {
            const matchesSearch =
                area.area_name.toLowerCase().includes(searchText) ||
                area.pincode.includes(searchText);
            const active = isEnabled(area.is_active);
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && active) ||
                (statusFilter === "inactive" && !active);
            return matchesSearch && matchesStatus;
        });
    }, [areas, search, statusFilter]);

    const activeCount = areas.filter((area) => isEnabled(area.is_active)).length;
    const inactiveCount = areas.length - activeCount;

    const resetAreaForm = () => {
        setAreaForm(emptyAreaForm);
        setEditingId(null);
    };

    const startEdit = (area: DeliveryArea) => {
        setAreaForm({
            area_name: area.area_name,
            pincode: area.pincode,
            delivery_charge: String(area.delivery_charge),
            is_active: isEnabled(area.is_active),
        });
        setEditingId(area.area_id);
        setSuccess("");
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleAreaSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSavingArea(true);
        setError("");
        setSuccess("");

        const payload = {
            area_name: areaForm.area_name.trim(),
            pincode: areaForm.pincode.trim(),
            delivery_charge: Number(areaForm.delivery_charge),
            is_active: areaForm.is_active,
        };

        try {
            if (editingId) {
                await API.put(`/admin/place/areas/${editingId}`, payload);
                setSuccess("Delivery locality updated successfully.");
            } else {
                await API.post("/admin/place/areas", payload);
                setSuccess("New delivery locality added successfully.");
            }
            resetAreaForm();
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || "Unable to save delivery locality.");
        } finally {
            setSavingArea(false);
        }
    };

    const handleSettingsSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSavingSettings(true);
        setError("");
        setSuccess("");
        try {
            await API.put("/admin/place/settings", {
                pickup_location: settingsForm.pickup_location.trim(),
                max_delivery_distance: Number(settingsForm.max_delivery_distance),
                delivery_enabled: settingsForm.delivery_enabled,
            });
            setSuccess("General delivery settings updated successfully.");
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || "Unable to update delivery settings.");
        } finally {
            setSavingSettings(false);
        }
    };

    const toggleAreaStatus = async (area: DeliveryArea) => {
        const nextStatus = !isEnabled(area.is_active);
        const confirmed = window.confirm(
            `${nextStatus ? "Activate" : "Deactivate"} ${area.area_name}?`
        );
        if (!confirmed) return;

        setError("");
        setSuccess("");
        try {
            await API.patch(`/admin/place/areas/${area.area_id}/status`, {
                is_active: nextStatus,
            });
            setSuccess(`${area.area_name} ${nextStatus ? "activated" : "deactivated"} successfully.`);
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || "Unable to change locality status.");
        }
    };

    return (
        <div className="product-delivery-page">
            <div className="delivery-page-heading">
                <div>
                    <span className="delivery-eyebrow">ADMINISTRATION</span>
                    <h1>Product Delivery</h1>
                    <p>Manage delivery coverage, localities, PIN codes and delivery charges.</p>
                </div>
                <button className="delivery-refresh-btn" onClick={() => void loadData()} disabled={loading}>
                    <RefreshCw size={16} className={loading ? "spinning" : ""} />
                    Refresh
                </button>
            </div>

            {error && <div className="delivery-alert error-alert">{error}</div>}
            {success && <div className="delivery-alert success-alert">{success}</div>}

            <div className="delivery-stat-grid">
                <div className="delivery-stat-card">
                    <span className="delivery-stat-icon"><MapPin size={20} /></span>
                    <div><strong>{areas.length}</strong><span>Total localities</span></div>
                </div>
                <div className="delivery-stat-card">
                    <span className="delivery-stat-icon green"><CheckCircle2 size={20} /></span>
                    <div><strong>{activeCount}</strong><span>Active localities</span></div>
                </div>
                <div className="delivery-stat-card">
                    <span className="delivery-stat-icon muted"><XCircle size={20} /></span>
                    <div><strong>{inactiveCount}</strong><span>Inactive localities</span></div>
                </div>
                <div className="delivery-stat-card">
                    <span className="delivery-stat-icon gold"><Truck size={20} /></span>
                    <div><strong>{settings ? `${Number(settings.max_delivery_distance)} km` : "—"}</strong><span>Maximum distance</span></div>
                </div>
            </div>

            <section className="delivery-panel">
                <div className="delivery-panel-heading">
                    <div>
                        <h2>General delivery settings</h2>
                        <p>Configure the business pickup location and delivery availability.</p>
                    </div>
                </div>
                {loading && !settings ? (
                    <p className="delivery-muted-text">Loading settings...</p>
                ) : (
                    <form className="delivery-settings-form" onSubmit={handleSettingsSubmit}>
                        <label className="delivery-field delivery-field-wide">
                            <span>Pickup location</span>
                            <input
                                value={settingsForm.pickup_location}
                                onChange={(event) => setSettingsForm({ ...settingsForm, pickup_location: event.target.value })}
                                maxLength={255}
                                required
                                placeholder="Thuthiyoor, Kakkanad, Ernakulam"
                            />
                        </label>
                        <label className="delivery-field">
                            <span>Maximum delivery distance (km)</span>
                            <input
                                type="number"
                                min="0.1"
                                max="100"
                                step="0.1"
                                value={settingsForm.max_delivery_distance}
                                onChange={(event) => setSettingsForm({ ...settingsForm, max_delivery_distance: event.target.value })}
                                required
                            />
                        </label>
                        <label className="delivery-toggle-field">
                            <input
                                type="checkbox"
                                checked={settingsForm.delivery_enabled}
                                onChange={(event) => setSettingsForm({ ...settingsForm, delivery_enabled: event.target.checked })}
                            />
                            <span><strong>Home delivery enabled</strong><small>Turn off to temporarily stop all home deliveries.</small></span>
                        </label>
                        <div className="delivery-form-actions delivery-field-wide">
                            <button className="delivery-primary-btn" type="submit" disabled={savingSettings}>
                                <Save size={16} /> {savingSettings ? "Saving..." : "Save settings"}
                            </button>
                        </div>
                    </form>
                )}
            </section>

            <section className="delivery-panel" id="delivery-area-form">
                <div className="delivery-panel-heading">
                    <div>
                        <h2>{editingId ? "Edit delivery locality" : "Add a delivery locality"}</h2>
                        <p>Add a locality or update its PIN code and delivery charge.</p>
                    </div>
                    {editingId && (
                        <button className="delivery-text-btn" type="button" onClick={resetAreaForm}>
                            <X size={15} /> Cancel edit
                        </button>
                    )}
                </div>
                <form className="delivery-area-form" onSubmit={handleAreaSubmit}>
                    <label className="delivery-field">
                        <span>Locality name</span>
                        <input
                            value={areaForm.area_name}
                            onChange={(event) => setAreaForm({ ...areaForm, area_name: event.target.value })}
                            maxLength={150}
                            required
                            placeholder="e.g. Kakkanad"
                        />
                    </label>
                    <label className="delivery-field">
                        <span>PIN code</span>
                        <input
                            value={areaForm.pincode}
                            onChange={(event) => setAreaForm({ ...areaForm, pincode: event.target.value.replace(/\D/g, "").slice(0, 6) })}
                            inputMode="numeric"
                            minLength={6}
                            maxLength={6}
                            required
                            placeholder="6-digit PIN code"
                        />
                    </label>
                    <label className="delivery-field">
                        <span>Delivery charge (₹)</span>
                        <input
                            type="number"
                            min="0"
                            max="100000"
                            step="0.01"
                            value={areaForm.delivery_charge}
                            onChange={(event) => setAreaForm({ ...areaForm, delivery_charge: event.target.value })}
                            required
                        />
                    </label>
                    <label className="delivery-toggle-field area-active-toggle">
                        <input
                            type="checkbox"
                            checked={areaForm.is_active}
                            onChange={(event) => setAreaForm({ ...areaForm, is_active: event.target.checked })}
                        />
                        <span><strong>Active locality</strong><small>Customers can select active localities.</small></span>
                    </label>
                    <div className="delivery-form-actions delivery-field-wide">
                        <button className="delivery-primary-btn" type="submit" disabled={savingArea}>
                            {editingId ? <Save size={16} /> : <Plus size={17} />}
                            {savingArea ? "Saving..." : editingId ? "Update locality" : "Add locality"}
                        </button>
                        {editingId && <button className="delivery-secondary-btn" type="button" onClick={resetAreaForm}>Clear form</button>}
                    </div>
                </form>
                <p className="delivery-help-note">New localities are managed by the admin. Please verify the actual road distance from the pickup location before accepting a delivery booking.</p>
            </section>

            <section className="delivery-panel delivery-list-panel">
                <div className="delivery-panel-heading delivery-list-heading">
                    <div>
                        <h2>Delivery localities</h2>
                        <p>Search, edit charges and control which localities are available to customers.</p>
                    </div>
                    <span className="delivery-count-pill">{filteredAreas.length} shown</span>
                </div>
                <div className="delivery-toolbar">
                    <div className="delivery-search-box">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search locality or PIN code"
                        />
                    </div>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter locality status">
                        <option value="all">All localities</option>
                        <option value="active">Active only</option>
                        <option value="inactive">Inactive only</option>
                    </select>
                </div>

                {loading ? (
                    <p className="delivery-empty-state">Loading delivery localities...</p>
                ) : filteredAreas.length === 0 ? (
                    <p className="delivery-empty-state">No delivery localities match your search.</p>
                ) : (
                    <div className="delivery-table-wrap">
                        <table className="delivery-table">
                            <thead>
                                <tr>
                                    <th>Locality</th>
                                    <th>PIN code</th>
                                    <th>Delivery charge</th>
                                    <th>Status</th>
                                    <th className="delivery-actions-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAreas.map((area) => {
                                    const active = isEnabled(area.is_active);
                                    return (
                                        <tr key={area.area_id}>
                                            <td className="delivery-locality-cell">{area.area_name}</td>
                                            <td>{area.pincode}</td>
                                            <td className="delivery-charge-cell">₹{Number(area.delivery_charge).toFixed(2)}</td>
                                            <td><span className={`delivery-status ${active ? "active" : "inactive"}`}>{active ? "Active" : "Inactive"}</span></td>
                                            <td>
                                                <div className="delivery-row-actions">
                                                    <button type="button" className="delivery-icon-btn" title="Edit locality" onClick={() => startEdit(area)}><Pencil size={16} /></button>
                                                    <button
                                                        type="button"
                                                        className={`delivery-status-btn ${active ? "deactivate" : "activate"}`}
                                                        onClick={() => void toggleAreaStatus(area)}
                                                    >
                                                        {active ? "Deactivate" : "Activate"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <div className="delivery-distance-warning">
                <strong>Delivery distance verification</strong>
                <span>PIN code and locality identify the delivery area, but they do not calculate road distance. The admin must manually verify addresses near or beyond the configured distance limit before approving the booking.</span>
            </div>
        </div>
    );
}

export default ProductDelivery;
