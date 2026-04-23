import { useNavigate, useParams } from "react-router";
import { fetchChartData, fetchCoinData } from "./Api/CoinGecko";
import { useEffect, useState } from "react";
import { formatPrice, formatMarketCap } from "../utils/formatter";
import {
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
} from "recharts";

export const CoinDetail = ({ toggleTheme, theme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coin, setCoin] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [IsLoading, setIsLoading] = useState(true);
  const [chartRateLimited, setChartRateLimited] = useState(false);
  const [coinRateLimited, setCoinRateLimited] = useState(false);
  const [retryIn, setRetryIn] = useState(60);

  useEffect(() => {
    loadCoinData();
    loadChartData();
  }, [id]);

  // countdown when either is rate limited
  useEffect(() => {
    if (!chartRateLimited && !coinRateLimited) return;
    setRetryIn(60);
    const countdown = setInterval(() => {
      setRetryIn((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setChartRateLimited(false);
          setCoinRateLimited(false);
          loadCoinData();
          loadChartData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [chartRateLimited, coinRateLimited]);

  const loadCoinData = async () => {
    try {
      const data = await fetchCoinData(id);
      setCoin(data);
      setCoinRateLimited(false);
    } catch (error) {
      if (error.message === "RATE_LIMITED") setCoinRateLimited(true);
      console.error("Error fetching coin:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const data = await fetchChartData(id);
      const formattedData = data.prices.map((price) => ({
        time: new Date(price[0]).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        price: parseFloat(price[1].toFixed(2)),
      }));
      setChartData(formattedData);
      setChartRateLimited(false);
    } catch (err) {
      if (err.message === "RATE_LIMITED") setChartRateLimited(true);
      console.error("Error fetching chart:", err.message);
    }
  };

  if (IsLoading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading coin data...</p>
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="app">
        <div className="not-found">
          <div className="not-found-icon">🔍</div>
          <h2>Coin Not Found</h2>
          <p>The coin you're looking for doesn't exist or failed to load.</p>
          <button className="not-found-btn" onClick={() => navigate("/")}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const priceChange = coin.market_data.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-actions">
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
          </div>
          <div className="logo-section">
            <h1>
              <span>🚀</span> Crypto Tracker
            </h1>
            <p>Real-time cryptocurrency prices and market data</p>
          </div>
          <button onClick={() => navigate("/")} className="back-button">
            ← Back To List
          </button>
        </div>
      </header>

      {/* Rate limit banner */}
      {(chartRateLimited || coinRateLimited) && (
        <div className="rate-limit-banner">
          <div className="rate-limit-content">
            <div className="rate-limit-icon">⚠️</div>
            <div className="rate-limit-text">
              <h3>API Rate Limit Reached</h3>
              <p>
                Auto-retrying in{" "}
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

      <div className="coin-detail">
        <div className="coin-header">
          <div className="coin-title">
            <img src={coin.image.large} alt={coin.name} />
            <div>
              <h1>{coin.name}</h1>
              <p className="symbol">{coin.symbol.toUpperCase()}</p>
            </div>
          </div>
          <span className="rank">Rank #{coin.market_data.market_cap_rank}</span>
        </div>

        <div className="coin-price-section">
          <div className="current-price">
            <h2>{formatPrice(coin.market_data.current_price.usd)}</h2>
            <span
              className={`change-badge ${isPositive ? "positive" : "negative"}`}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(priceChange).toFixed(2)}%
            </span>
          </div>
          <div className="price-ranges">
            <div className="price-range">
              <span className="range-label">24h High</span>
              <span className="range-value">
                {formatPrice(coin.market_data.high_24h.usd)}
              </span>
            </div>
            <div className="price-range">
              <span className="range-label">24h Low</span>
              <span className="range-value">
                {formatPrice(coin.market_data.low_24h.usd)}
              </span>
            </div>
          </div>
        </div>

        {/* Chart section */}
        <div className="chart-section">
          <h3>Price Chart (7 Days)</h3>
          {chartRateLimited ? (
            <div className="chart-unavailable">
              <p>
                📊 Chart unavailable due to rate limit. Retrying in{" "}
                <span className="retry-countdown">{retryIn}s</span>
              </p>
            </div>
          ) : chartData.length > 0 ? ( // ✅ guard is NOW inside JSX
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="time"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20,20,40,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#e0e0e0",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#ADD8E6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-unavailable">
              <p>📊 Loading chart data...</p>
            </div>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Market Cap</span>
            <span className="stat-value">
              ${formatMarketCap(coin.market_data.market_cap.usd)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Volume (24h)</span>
            <span className="stat-value">
              ${formatMarketCap(coin.market_data.total_volume.usd)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Circulating Supply</span>
            <span className="stat-value">
              {coin.market_data.circulating_supply?.toLocaleString() || "N/A"}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Supply</span>
            <span className="stat-value">
              {coin.market_data.total_supply?.toLocaleString() || "N/A"}
            </span>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Data provided by CoinGecko API • Updated every 60 seconds</p>
      </footer>
    </div>
  );
};
