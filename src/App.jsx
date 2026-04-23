import { BrowserRouter, Routes, Route } from "react-router";
import { Home } from "./pages/Home";
import { CoinDetail } from "./pages/CoinDetail";
import { useState, useEffect } from "react";

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home toggleTheme={toggleTheme} theme={theme} />}
        />
        <Route
          path="/coin/:id"
          element={<CoinDetail toggleTheme={toggleTheme} theme={theme} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
