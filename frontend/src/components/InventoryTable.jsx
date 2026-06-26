import { getStatusColor, getStatusBg } from '../utils/helpers';

function InventoryTable({ inventory = [], onUpdate }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Current Stock</th>
            <th>Min Stock</th>
            <th>Status</th>
            {onUpdate && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {inventory.length === 0 ? (
            <tr><td colSpan={onUpdate ? 6 : 5} className="empty-state">No inventory records found</td></tr>
          ) : (
            inventory.map(item => (
              <tr key={item.inventory_id}>
                <td className="product-info">
                  {item.image && <img src={item.image} alt={item.name} className="mini-thumb" />}
                  <span>{item.name}</span>
                </td>
                <td>{item.category}</td>
                <td className={item.current_stock <= item.minimum_stock ? 'stock-low' : 'stock-ok'}>
                  {item.current_stock}
                </td>
                <td>{item.minimum_stock}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ background: getStatusBg(item.status), color: getStatusColor(item.status) }}
                  >
                    {item.status}
                  </span>
                </td>
                {onUpdate && (
                  <td>
                    <button className="action-btn update-btn" onClick={() => onUpdate(item)}>Update</button>
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

export default InventoryTable;
