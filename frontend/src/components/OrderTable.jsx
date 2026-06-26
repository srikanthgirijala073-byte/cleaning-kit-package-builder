import { getStatusColor, getStatusBg, formatCurrency, formatDate, truncateText } from '../utils/helpers';

function OrderTable({ orders = [], onView, showActions = true }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Package</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr><td colSpan={showActions ? 7 : 6} className="empty-state">No orders found</td></tr>
          ) : (
            orders.map(order => (
              <tr key={order.order_id}>
                <td className="order-id">#{order.order_id}</td>
                <td>{truncateText(order.customer_name, 20)}</td>
                <td>{truncateText(order.package_name, 25)}</td>
                <td className="amount">{formatCurrency(order.amount)}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ background: getStatusBg(order.status), color: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="date-cell">{formatDate(order.created_at)}</td>
                {showActions && (
                  <td>
                    <button className="action-btn view-btn" onClick={() => onView && onView(order)}>View</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OrderTable;
