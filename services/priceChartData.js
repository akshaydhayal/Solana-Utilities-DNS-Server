import fetch from "node-fetch";

// Modified cache configuration for pre-rendered price chart
const cache = {
  data: null,           // Raw API data
  renderedChart: null,  // Pre-rendered chart output
  timestamp: 0,
  ttl: 1200000,         // Cache TTL in milliseconds (20 minutes)
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }
};

// Updated API endpoint
const PRICE_API = "https://api.solanabeach.io/v2/market-data";
const API_KEY = "469ba747-f6d4-4995-a139-46ed89ac001e";

// Format large numbers to readable format with appropriate suffix
function formatLargeNumber(num) {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(2);
}

// Format timestamp to readable date format (e.g., "05/15 14:30")
function formatTimestamp(timestamp) {
  // Handle Unix timestamp in seconds (new API) vs milliseconds (old API)
  const ms = timestamp > 9999999999 ? timestamp : timestamp * 1000;
  const date = new Date(ms);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

// Create ASCII price chart with improved axis labels and timestamps
function createAsciiPriceChart(priceData, width = 50, height = 10) {
  // Extract price and timestamp data
  const prices = priceData.map(d => d.price);
  const timestamps = priceData.map(d => d.timestamp);
  
  // Calculate min/max for scaling
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // Sample data points to fit the width
  const sampledData = [];
  const step = Math.max(1, Math.floor(priceData.length / width));
  
  for (let i = 0; i < priceData.length; i += step) {
    sampledData.push(priceData[i]);
  }
  
  // Ensure we don't exceed the desired width
  const dataPoints = sampledData.slice(0, width);

  // Generate the chart
  const chart = [];
  
  // Create the chart rows
  for (let i = 0; i < height; i++) {
    chart.push(Array(dataPoints.length).fill(' '));
  }

  // Plot the price points
  dataPoints.forEach((point, x) => {
    // Scale price to chart height
    const normalizedPrice = priceRange === 0 ? 0 : (point.price - minPrice) / priceRange;
    const y = Math.floor((height - 1) * (1 - normalizedPrice));
    
    // Ensure y is within bounds
    const boundedY = Math.max(0, Math.min(height - 1, y));
    chart[boundedY][x] = '*';
  });

  // Convert the chart to strings
  const chartLines = chart.map(row => row.join(''));

  // Add price scale and axis labels
  const formattedMaxPrice = `${maxPrice.toFixed(2)}`;
  const formattedMinPrice = `${minPrice.toFixed(2)}`;
  const midPrice = minPrice + (priceRange / 2);
  const formattedMidPrice = `${midPrice.toFixed(2)}`;
  
  // Get timestamps for display
  const oldestTimestamp = formatTimestamp(dataPoints[0].timestamp);
  const latestTimestamp = formatTimestamp(dataPoints[dataPoints.length - 1].timestamp);
  const midIndex = Math.floor(dataPoints.length / 2);
  const midTimestamp = formatTimestamp(dataPoints[midIndex].timestamp);

  // Construct chart with price markers using only ASCII characters
  const result = [
    `$${formattedMaxPrice} +${'-'.repeat(width)}+`,
    ...chartLines.map((line, i) => {
      if (i === 0) return `        | ${line}|`;
      if (i === Math.floor(height / 2)) return `$${formattedMidPrice} |${line}|`;
      if (i === height - 1) return `$${formattedMinPrice} |${line}|`;
      return `        |${line}|`;
    }),
    `       +${'-'.repeat(width)}+`,
    `         ${oldestTimestamp.padEnd(Math.floor(width/3))}${midTimestamp.padEnd(Math.floor(width/3))}${latestTimestamp}`,
  ];

  return result;
}

// Fetch fresh price data from API
async function fetchPriceData() {
  console.log(`Fetching fresh price data at ${new Date().toISOString()}`);
  try {
    const res = await fetch(PRICE_API, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch price data:", err.message);
    throw err;
  }
}

// Get time range of the chart data
function getTimeRangeText(priceData) {
  if (!priceData || priceData.length < 2) return "";

  const firstTimestamp = priceData[0].timestamp;
  const lastTimestamp = priceData[priceData.length - 1].timestamp;

  // Handle Unix timestamp in seconds (new API) vs milliseconds (old API)
  const getMs = (ts) => ts > 9999999999 ? ts : ts * 1000;
  
  // Calculate the time difference in hours
  const diffMs = getMs(lastTimestamp) - getMs(firstTimestamp);
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  return `Chart shows ${diffHours} hour${diffHours !== 1 ? 's' : ''} of price data`;
}

// Process price data and return formatted response lines
async function renderPriceChart(data) {
  if (!data || !data.history || data.history.length === 0) {
    return ["No price data available"];
  }
  
  // Get latest price info from main data object
  const latest = {
    price: data.price,
    timestamp: data.timestamp,
    volume_24h: data.volume24h,
    market_cap: data.marketCap
  };
  
  // Get change percentage directly from the API response
  const priceChangePercent = data.percentChange24h;
  const priceChangeDirection = priceChangePercent >= 0 ? "^" : "v";
  const priceChangeColor = priceChangePercent >= 0 ? "+" : "";

  // Format main metrics
  const currentPrice = `$${latest.price.toFixed(2)}`;
  const priceChangeText = `${priceChangeColor}${Math.abs(priceChangePercent).toFixed(2)}% ${priceChangeDirection}`;
  const volume24h = `24H Volume - $${formatLargeNumber(latest.volume_24h)}`;

  // Use market cap directly from the API
  const marketCapText = `Market Cap - $${formatLargeNumber(latest.market_cap)}`;

  // Get timestamp information
  const currentTime = formatTimestamp(latest.timestamp);

  // Create chart using historical data
  const priceHistory = data.history.map(point => ({
    price: point.price,
    timestamp: point.timestamp
  }));
  
  // Sort history by timestamp (ascending)
  priceHistory.sort((a, b) => a.timestamp - b.timestamp);
  
  // Add the current price point to the history for chart display
  priceHistory.push({
    price: latest.price,
    timestamp: latest.timestamp
  });
  
  const chart = createAsciiPriceChart(priceHistory);
  
  // Get time range text
  const timeRangeText = getTimeRangeText(priceHistory);

  // Construct the complete response
  const response = [
    `SOL Price: ${currentPrice} (${priceChangeText}) (as of ${currentTime})`,
    marketCapText,
    volume24h,
    ...chart,
  ];

  return response;
}

// Function to update the cache with fresh data and pre-render the chart
async function updateCache() {
  try {
    const freshData = await fetchPriceData();
    const renderedChart = await renderPriceChart(freshData);
    
    // Update cache
    cache.data = freshData;
    cache.renderedChart = renderedChart;
    cache.timestamp = Date.now();

    console.log(`Price Chart Cache data updated successfully at ${new Date().toLocaleString()}`);
    return true;
  } catch (err) {
    console.error("Failed to update cache:", err.message);
    return false;
  }
}

// Function to get the pre-rendered price chart
function getPriceChartLines() {
  // If cache is empty or expired but we have stale data, return the stale data
  // while triggering a background refresh
  if (cache.renderedChart && cache.isExpired()) {
    console.log("Cache is expired but returning stale data while refreshing");
    updateCache().catch(err => {
      console.error("Background cache refresh failed:", err.message);
    });
    
    // Return the stale data immediately
    return cache.renderedChart;
  }

  // If we have valid cached data, return it
  if (cache.renderedChart) {
    return cache.renderedChart;
  }

  // If we have no data at all, return a message
  return ["Loading price data. Please try again shortly."];
}

// Initialize the cache on module load
async function initializeCache() {
  console.log("Initializing cache with first data load");
  await updateCache();
  
  // Set up periodic cache refresh every 20 minutes
  setInterval(updateCache, cache.ttl);
}

// Run the initial cache load
initializeCache().catch(err => {
  console.error("Failed to initialize cache:", err.message);
});

export default {
  getPriceChartLines,
  forceRefresh: updateCache  // Expose a method to force refresh if needed
};