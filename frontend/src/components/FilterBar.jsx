import "./FilterBar.css";

function FilterBar({
  categories = [],
  selectedCategory,
  setSelectedCategory,
}) {
  return (
    <div className="filter-bar">

      <label className="filter-label">
        Category
      </label>

      <select
        className="filter-select"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="All">All Categories</option>

        {categories.map((category, index) => (
          <option key={index} value={category}>
            {category}
          </option>
        ))}
      </select>

    </div>
  );
}

export default FilterBar;