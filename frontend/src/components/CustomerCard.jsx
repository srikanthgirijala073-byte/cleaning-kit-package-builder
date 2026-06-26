import { FaEnvelope, FaPhone, FaBuilding, FaMapMarkerAlt } from 'react-icons/fa';

function CustomerCard({ customer, onClick }) {
  return (
    <div className="customer-card card glass" onClick={() => onClick && onClick(customer)}>
      <div className="customer-avatar">
        {customer.image ? (
          <img src={customer.image} alt={customer.name} />
        ) : (
          <div className="avatar-placeholder">{customer.name?.charAt(0) || '?'}</div>
        )}
      </div>
      <div className="customer-info">
        <h4>{customer.name}</h4>
        <div className="customer-detail">
          <FaEnvelope />
          <span>{customer.email}</span>
        </div>
        {customer.phone && (
          <div className="customer-detail">
            <FaPhone />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.company && (
          <div className="customer-detail">
            <FaBuilding />
            <span>{customer.company}</span>
          </div>
        )}
        {customer.address && (
          <div className="customer-detail">
            <FaMapMarkerAlt />
            <span>{customer.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerCard;
