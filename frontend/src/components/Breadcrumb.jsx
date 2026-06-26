import "./Breadcrumb.css";

function Breadcrumb({ page }) {
  return (
    <div className="breadcrumb">
      Dashboard / {page}
    </div>
  );
}

export default Breadcrumb;