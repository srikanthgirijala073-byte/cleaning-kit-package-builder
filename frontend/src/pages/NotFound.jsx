import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="notfound-container">
      <h1>404</h1>
      <h2>Page Not Found</h2>

      <Link to="/">
        <button>Go Home</button>
      </Link>
    </div>
  );
}

export default NotFound;