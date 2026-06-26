import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {

  const { darkMode, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}

export default ThemeToggle;