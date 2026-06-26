import { FaSearch, FaTimes } from "react-icons/fa";
import "./SearchBar.css";

function SearchBar({
  searchTerm,
  setSearchTerm,
  placeholder = "Search..."
}) {
  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="search-bar">

      <div className="search-container">

        <FaSearch className="search-icon" />

        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {searchTerm && (
          <button
            className="clear-btn"
            onClick={clearSearch}
          >
            <FaTimes />
          </button>
        )}

      </div>

    </div>
  );
}

export default SearchBar;