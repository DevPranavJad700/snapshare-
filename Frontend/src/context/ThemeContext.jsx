import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("snap_theme") || "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem("snap_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    // Add transition class, then remove after animation
    document.documentElement.classList.add("theme-switching");
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    setTimeout(() => {
      document.documentElement.classList.remove("theme-switching");
    }, 500);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
