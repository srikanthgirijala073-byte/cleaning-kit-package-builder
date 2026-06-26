import { Link } from "react-router-dom";
import "./OrderCard.css";
import StatusBadge from "./StatusBadge";

function OrderCard({
  orderId,
  customerName,
  packageName,
  quantity,
  amount,
  status,
  date,
}) {
  const steps = ["Placed", "Processing", "Shipped", "Delivered"];

  const getStepStatus = (stepName) => {
    if (status === "Cancelled") return "cancelled";
    
    const statusMap = {
      "Pending": 1,
      "Processing": 2,
      "Shipped": 3,
      "Delivered": 4,
      "Completed": 4
    };
    
    const currentStepIndex = statusMap[status] || 1;
    
    const stepIndices = {
      "Placed": 1,
      "Processing": 2,
      "Shipped": 3,
      "Delivered": 4
    };
    
    const thisStepIndex = stepIndices[stepName];
    
    if (thisStepIndex < currentStepIndex) return "completed";
    if (thisStepIndex === currentStepIndex) return "active";
    return "pending";
  };

  return (
    <div className="order-card">
      <div className="order-card-header">
        <h3>
          <Link to={`/details/${orderId.replace(/^ORD0*/, '')}`} className="order-header-link" style={{ color: '#2563eb', textDecoration: 'none' }}>
            {orderId}
          </Link>
        </h3>
        <StatusBadge status={status} />
      </div>

      <div className="order-card-body">
        <div className="order-row">
          <span className="label">Customer</span>
          <span>{customerName}</span>
        </div>

        <div className="order-row">
          <span className="label">Package</span>
          <span>{packageName}</span>
        </div>

        <div className="order-row">
          <span className="label">Quantity</span>
          <span>{quantity}</span>
        </div>

        <div className="order-row">
          <span className="label">Amount</span>
          <span className="amount-val">₹{amount}</span>
        </div>

        <div className="order-row">
          <span className="label">Date</span>
          <span>{date}</span>
        </div>

        {/* Dynamic Tracking Timeline */}
        <div className="order-tracking-timeline">
          {steps.map((step, idx) => {
            const stepStatus = getStepStatus(step);
            return (
              <div key={step} className={`tracking-step ${stepStatus}`}>
                <div className="step-dot">
                  {stepStatus === "completed" ? "✓" : idx + 1}
                </div>
                <span className="step-label">{step}</span>
                {idx < steps.length - 1 && (
                  <div className={`step-line ${stepStatus === "completed" ? "line-completed" : ""}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderCard;