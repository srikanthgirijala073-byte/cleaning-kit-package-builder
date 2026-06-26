import { Link } from "react-router-dom";
import "./DashboardTable.css";
import StatusBadge from "./StatusBadge";

function DashboardTable({ orders }) {
  return (
    <div className="dashboard-table-container">

      <div className="table-header">
        <h2>Recent Orders</h2>
      </div>

      <table className="dashboard-table">

        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Package Name</th>
            <th>Quantity</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link to={`/details/${order.id.replace(/^ORD0*/, '')}`} className="order-id-link" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}>
                  {order.id}
                </Link>
              </td>
              <td>{order.customer}</td>
              <td>{order.packageName}</td>
              <td>{order.quantity}</td>
              <td>₹{order.amount}</td>
              <td>
                <StatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}

export default DashboardTable;