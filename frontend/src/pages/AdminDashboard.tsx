import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,} from "recharts";

import {ShoppingBag,IndianRupee,Users,Clock,} from "lucide-react";

import "./css/AdminDashboard.css";
const orderData = [
    { month: "Jan", orders: 20 },
    { month: "Feb", orders: 35 },
    { month: "Mar", orders: 28 },
    { month: "Apr", orders: 45 },
    { month: "May", orders: 38 },
    { month: "Jun", orders: 55 },
];

const statusData = [
    { name: "Completed", value: 65 },
    { name: "Pending", value: 20 },
    { name: "Cancelled", value: 15 },
];

const colors = ["#15966b", "#f0ad4e", "#e05252"];

function AdminDashboard() {
    const cards = [
        {
            title: "Total Orders",
            value: "125",
            icon: <ShoppingBag />,
            note: "All orders",
        },
        {
            title: "Total Revenue",
            value: "₹45,000",
            icon: <IndianRupee />,
            note: "Illustrative revenue",
        },
        {
            title: "Total Customers",
            value: "80",
            icon: <Users />,
            note: "Registered customers",
        },
        {
            title: "Pending Orders",
            value: "12",
            icon: <Clock />,
            note: "Awaiting action",
        },
    ];

    return (
        <div className="dashboard-container">

            {/* Dashboard Heading */}
            <div className="dashboard-title">
                <h2>Dashboard Overview</h2>
                <p>Welcome back! Here's what's happening with your business.</p>
            </div>

            {/* Summary Cards */}
            <div className="dashboard-cards">
                {cards.map((card) => (
                    <div className="dashboard-card" key={card.title}>
                        <div className="card-heading">
                            <p>{card.title}</p>
                            <span className="card-icon">{card.icon}</span>
                        </div>

                        <h2>{card.value}</h2>
                        <span>{card.note}</span>
                    </div>
                ))}
            </div>

            {/* Analytics */}
            <div className="dashboard-analytics">

                <div className="analytics-box">
                    <h3>Monthly Orders</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={orderData}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                                dataKey="orders"
                                fill="#15966b"
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="analytics-box">
                    <h3>Order Status</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={90}
                                label
                            >
                                {statusData.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={colors[index]}
                                    />
                                ))}
                            </Pie>

                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

            </div>

            {/* Recent Orders */}
            <div className="recent-orders">
                <h3>Recent Orders</h3>

                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td>#1001</td>
                            <td>Anna</td>
                            <td>Laddu</td>
                            <td>₹500</td>
                            <td>Completed</td>
                        </tr>

                        <tr>
                            <td>#1002</td>
                            <td>Maria</td>
                            <td>Achappam</td>
                            <td>₹350</td>
                            <td>Pending</td>
                        </tr>

                        <tr>
                            <td>#1003</td>
                            <td>John</td>
                            <td>Unniyappam</td>
                            <td>₹700</td>
                            <td>Preparing</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
}

export default AdminDashboard;