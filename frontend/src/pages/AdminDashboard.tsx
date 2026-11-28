
import { useEffect, useState } from "react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

import {
    ShoppingBag,
    IndianRupee,
    CreditCard,
    Clock,
    RefreshCw,
} from "lucide-react";

import API from "../services/api";
import "./css/AdminDashboard.css";

interface DashboardData {
    summary: {
        total_orders: number;
        total_revenue: number;
        total_customers: number;
        pending_orders: number;
    };

    pendingPayments: {
        total_count: number;
        total_amount: number;
        advance_count: number;
        advance_amount: number;
        balance_count: number;
        balance_amount: number;
    };

    monthlyRevenue: {
        month_key: string;
        month: string;
        revenue: number;
    }[];

    statusData: {
        name: string;
        value: number;
    }[];

    recentOrders: {
        order_id: number;
        customer_name: string;
        total_amount: number;
        order_status: string;
        created_at: string;
        products: string | null;
    }[];
}

function formatCurrency(amount: number) {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatDate(date: string) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function AdminDashboard() {
    const [dashboardData, setDashboardData] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/admin/orders/dashboard");

            setDashboardData(response.data);
        } catch (error) {
            console.error("Dashboard loading error:", error);
            setError("Unable to load dashboard information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-loading">
                    Loading dashboard information...
                </div>
            </div>
        );
    }

    if (error || !dashboardData) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-title">
                    <h2>Dashboard Overview</h2>
                    <p>Monitor your business performance.</p>
                </div>

                <div className="dashboard-error">
                    {error || "Dashboard data unavailable."}
                </div>

                <button
                    type="button"
                    className="dashboard-refresh-button"
                    onClick={fetchDashboardData}
                >
                    <RefreshCw size={16} />
                    Try Again
                </button>
            </div>
        );
    }

    const {
        summary,
        pendingPayments,
        monthlyRevenue,
        statusData,
        recentOrders,
    } = dashboardData;

    const cards = [
        {
            title: "Total Bookings",
            value: summary.total_orders.toLocaleString("en-IN"),
            note: "All customer bookings",
            icon: <ShoppingBag />,
        },
        {
            title: "Monthly Revenue",
            value: formatCurrency(summary.total_revenue),
            note: "Actual payments received this month",
            icon: <IndianRupee />,
        },
        {
            title: "Payments to Verify",
            value: pendingPayments.total_count.toLocaleString("en-IN"),
            note: formatCurrency(pendingPayments.total_amount) + " awaiting verification",
            icon: <CreditCard />,
        },
        {
            title: "Pending Bookings",
            value: summary.pending_orders.toLocaleString("en-IN"),
            note: "Awaiting admin approval",
            icon: <Clock />,
        },
    ];

    const maximumStatusCount = Math.max(
        ...statusData.map((item) => Number(item.value)),
        1
    );

    return (
        <div className="dashboard-container">

            {/* Dashboard Heading */}
            <div className="dashboard-title">
                <div>
                    <h2>Dashboard Overview</h2>
                    <p>
                        Welcome back! Here's what's happening
                        with your business.
                    </p>
                </div>

                <button
                    type="button"
                    className="dashboard-refresh-button"
                    onClick={fetchDashboardData}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="dashboard-cards">
                {cards.map((card) => (
                    <div className="dashboard-card" key={card.title}>
                        <div className="card-heading">
                            <p>{card.title}</p>

                            <span className="card-icon">
                                {card.icon}
                            </span>
                        </div>

                        <h2>{card.value}</h2>
                        <span>{card.note}</span>
                    </div>
                ))}
            </div>

            {/* Monthly Revenue Chart */}
            <div className="dashboard-analytics">
                <div className="analytics-box">
                    <h3>Monthly Revenue</h3>

                    {monthlyRevenue.length === 0 ? (
                        <div className="dashboard-empty">
                            No revenue data available yet.
                        </div>
                    ) : (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={monthlyRevenue}
                                    margin={{
                                        top: 10,
                                        right: 15,
                                        left: 10,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#EEEAE2"
                                    />

                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: "#817D75", fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        tick={{ fill: "#817D75", fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) =>
                                            `₹${Number(value).toLocaleString("en-IN")}`
                                        }
                                    />

                                    <Tooltip
                                        formatter={(value) => [
                                            formatCurrency(Number(value)),
                                            "Revenue",
                                        ]}
                                        contentStyle={{
                                            borderRadius: "10px",
                                            border: "1px solid #EAE6DE",
                                        }}
                                    />

                                    <Bar
                                        dataKey="revenue"
                                        name="Revenue"
                                        fill="#718B76"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={48}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Payment Verification Summary */}
                <div className="payment-summary">
                    <h3>Payment Verification</h3>

                    <div className="payment-summary-grid">
                        <div className="payment-summary-item">
                            <p>Advance Payments</p>

                            <h4>
                                {pendingPayments.advance_count}
                            </h4>

                            <span>
                                {formatCurrency(
                                    pendingPayments.advance_amount
                                )}
                            </span>
                        </div>

                        <div className="payment-summary-item">
                            <p>Balance Payments</p>

                            <h4>
                                {pendingPayments.balance_count}
                            </h4>

                            <span>
                                {formatCurrency(
                                    pendingPayments.balance_amount
                                )}
                            </span>
                        </div>
                    </div>

                    <div>
                        <p className="payment-summary-total-label">
                            Total awaiting verification
                        </p>

                        <h3 className="payment-summary-total">
                            {formatCurrency(pendingPayments.total_amount)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Booking Status */}
            <div className="analytics-box">
                <h3>Booking Status Overview</h3>

                {statusData.length === 0 ? (
                    <div className="dashboard-empty">
                        No booking status data available.
                    </div>
                ) : (
                    <div className="status-list">
                        {statusData.map((item) => (
                            <div className="status-item" key={item.name}>
                                <div className="status-item-header">
                                    <span>{item.name}</span>
                                    <strong>{item.value}</strong>
                                </div>

                                <div className="status-bar">
                                    <div
                                        className="status-bar-fill"
                                        style={{
                                            width: `${
                                                (Number(item.value) /
                                                    maximumStatusCount) *
                                                100
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Bookings */}
            <div className="recent-orders">
                <div className="recent-orders-header">
                    <h3>Recent Bookings</h3>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="dashboard-empty">
                        No bookings available yet.
                    </div>
                ) : (
                    <div className="recent-orders-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Customer</th>
                                    <th>Products</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.order_id}>
                                        <td>#{order.order_id}</td>

                                        <td>{order.customer_name}</td>

                                        <td>
                                            {order.products || "—"}
                                        </td>

                                        <td>
                                            {formatCurrency(order.total_amount)}
                                        </td>

                                        <td>
                                            {order.order_status}
                                        </td>

                                        <td>
                                            {formatDate(order.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}

export default AdminDashboard;
