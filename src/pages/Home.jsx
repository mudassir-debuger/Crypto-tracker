import { useEffect, useState } from "react";
import { fetchCryptos } from "./Api/CoinGecko";
import { CryptoCard } from "../components/CryptoCard";

export const Home = ({ toggleTheme, theme }) => {
  const [cryptoList, setCryptoList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [IsLoading, setIsLoading] = useState(true);
  const [viewMod, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("market_cap_rank");
  const [searchQuery, setSearchQuery] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [retryIn, setRetryIn] = useState(60);

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [sortBy, cryptoList, searchQuery]);

  // countdown timer when rate limited
  useEffect(() => {
    if (!rateLimited) return;
    setRetryIn(60);
    const countdown = setInterval(() => {
      setRetryIn((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setRateLimited(false);
          fetchCryptoData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [rateLimited]);

  const fetchCryptoData = async () => {
    try {
      const data = await fetchCryptos();
      setCryptoList(data);
      setRateLimited(false);
    } catch (error) {
      if (error.message === "RATE_LIMITED") {
        setRateLimited(true);
      }
      console.error("Error fetching crypto:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSort = () => {
    let filtered = cryptoList.filter(
      (crypto) =>
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return a.current_price - b.current_price;
        case "price_desc":
          return b.current_price - a.current_price;
        case "change":
          return a.price_change_percentage_24h - b.price_change_percentage_24h;
        case "market_cap":
          return a.market_cap - b.market_cap;
        default:
          return a.market_cap_rank - b.market_cap_rank;
      }
    });
    setFilteredList(filtered);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <h1>
              <span>🚀</span> Crypto Tracker
            </h1>
            <p>Real-time cryptocurrency prices and market data</p>
          </div>
          <div className="header-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                  {theme === "dark" ? "🌙" : "☀️"}
                </span>
              </span>
            </button>
            <div className="search-section">
              <input
                type="text"
                placeholder="Search cryptos..."
                className="search-input"
                onChange={(e) => setSearchQuery(e.target.value)}
                value={searchQuery}
              />
            </div>
          </div>
        </div>
      </header>

      {rateLimited && (
        <div className="rate-limit-banner">
          <div className="rate-limit-content">
            <div className="rate-limit-icon">⚠️</div>
            <div className="rate-limit-text">
              <h3>API Rate Limit Reached</h3>
              <p>
                CoinGecko's free tier limits requests. Auto-retrying in{" "}
                <span className="retry-countdown">{retryIn}s</span>
              </p>
            </div>
            <div className="rate-limit-bar-wrap">
              <div
                className="rate-limit-bar"
                style={{ width: `${(retryIn / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="controls">
        <div className="filter-group">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={
              theme === "dark"
                ? { backgroundColor: "#0d1b2a", color: "#ffffff" }
                : {}
            }
          >
            <option value="market_cap_rank">Rank</option>
            <option value="name">Name</option>
            <option value="price">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="change">24h Change</option>
            <option value="market_cap">Market Cap</option>
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={viewMod === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </button>
          <button
            className={viewMod === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
        </div>
      </div>

      {IsLoading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading crypto data...</p>
        </div>
      ) : (
        <div className={`crypto-container ${viewMod}`}>
          {filteredList.map((crypto) => (
            <CryptoCard key={crypto.id} crypto={crypto} />
          ))}
        </div>
      )}

      <footer className="footer">
        <p>Data provided by CoinGecko API • Updated every 60 seconds</p>
      </footer>
    </div>
  );
};
