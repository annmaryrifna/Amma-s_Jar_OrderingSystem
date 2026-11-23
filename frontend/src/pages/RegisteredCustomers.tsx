
import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import "./css/RegisteredCustomers.css";

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: number;
    created_at: string;
}

const RegisteredCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const fetchCustomers = async () => {
        try {
            setError("");

            const response = await API.get("/admin/customers");

            setCustomers(response.data.customers || []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load registered customers."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const counts = useMemo(() => ({
        total: customers.length,
        active: customers.filter(c => Number(c.is_active) === 1).length,
        inactive: customers.filter(c => Number(c.is_active) === 0).length,
    }), [customers]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(customer => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                customer.name.toLowerCase().includes(searchText) ||
                customer.email.toLowerCase().includes(searchText) ||
                String(customer.phone || "").includes(searchText) ||
                String(customer.id).includes(searchText);

            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Active" && Number(customer.is_active) === 1) ||
                (statusFilter === "Inactive" && Number(customer.is_active) === 0);

            return matchesSearch && matchesStatus;
        });
    }, [customers, search, statusFilter]);

    const formatDate = (date: string) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kolkata",
        });
    };

    if (loading) {
        return <div className="customers-loading">Loading customers...</div>;
    }

    return (
        <div className="registered-customers">
            <div className="customers-header">
                <div>
                    <h2>Registered Customers</h2>
                    <p>View and manage your registered customer accounts.</p>
                </div>

                <button
                    className="customers-refresh-button"
                    onClick={fetchCustomers}
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="customers-error">{error}</div>
            )}

            {/* Summary Cards */}
            <div className="customers-summary">
                <div className="customer-summary-card">
                    <span>Total Customers</span>
                    <h3>{counts.total}</h3>
                </div>

                <div className="customer-summary-card">
                    <span>Active Customers</span>
                    <h3>{counts.active}</h3>
                </div>

                <div className="customer-summary-card">
                    <span>Inactive Customers</span>
                    <h3>{counts.inactive}</h3>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="customers-filters">
                <input
                    type="text"
                    placeholder="Search by name, email, phone or ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Customers</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            {/* Customer Table */}
            <div className="customers-table-container">
                <table className="customers-table">
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>Customer Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Registered Date</th>
                            <th>Account Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="no-customers">
                                    No customers found.
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td>#{customer.id}</td>
                                    <td><strong>{customer.name}</strong></td>
                                    <td>{customer.email}</td>
                                    <td>{customer.phone || "-"}</td>
                                    <td>{formatDate(customer.created_at)}</td>
                                    <td>
                                        <span className={`customer-status ${Number(customer.is_active) === 1
                                                ? "active"
                                                : "inactive"
                                            }`}>
                                            {Number(customer.is_active) === 1
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <p className="customers-results">
                Showing {filteredCustomers.length} of {customers.length} customers
            </p>
        </div>
    );
};

export default RegisteredCustomers;
