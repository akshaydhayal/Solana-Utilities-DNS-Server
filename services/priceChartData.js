import fetch from "node-fetch";

// Cache configuration for price chart data
const cache = {
  data: null,
  timestamp: 0,
  ttl: 300000, // Cache TTL in milliseconds (1 minute)
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }
};

const PRICE_API = "https://api.solanabeach.io/v1/market-chart-data";
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
  const date = new Date(timestamp);
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
  
  // Add a price axis label
  const priceLabel = "PRICE ($)";
  
  // Construct chart with price markers using only ASCII characters
  const result = [
    // `${priceLabel}`,
    `$${formattedMaxPrice} +${'-'.repeat(width)}+`,
    ...chartLines.map((line, i) => {
      if (i === 0) return `        | ${line}|`;
      if (i === Math.floor(height / 2)) return `$${formattedMidPrice} |${line}|`;
      if (i === height - 1) return `$${formattedMinPrice} |${line}|`;
      return `        |${line}|`;
    }),
    `       +${'-'.repeat(width)}+`,
    `         ${oldestTimestamp.padEnd(Math.floor(width/3))}${midTimestamp.padEnd(Math.floor(width/3))}${latestTimestamp}`,
    `      ${'='.repeat(Math.floor(width/2))}TIME${'='.repeat(Math.floor(width/2))}`
  ];
  
  return result;
}

// Fetch fresh price data from API or return cached data if valid
async function getPriceData() {
  // Return cached data if it's not expired
  if (cache.data && !cache.isExpired()) {
    console.log("Using cached price data");
    return cache.data;
  }

  // Otherwise fetch fresh data
  console.log("Fetching fresh price data");
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
    
    // Update cache
    cache.data = data;
    cache.timestamp = Date.now();
    
    return data;
  } catch (err) {
    console.error("Failed to fetch price data:", err.message);
    
    // Return stale cache if available (better than nothing)
    if (cache.data) {
      console.log("Using stale cache as fallback");
      return cache.data;
    }
    throw err;
  }
}

// Get time range of the chart data
function getTimeRangeText(priceData) {
  if (!priceData || priceData.length < 2) return "";
  
  const firstTimestamp = priceData[0].timestamp;
  const lastTimestamp = priceData[priceData.length - 1].timestamp;
  
  // Calculate the time difference in hours
  const diffMs = lastTimestamp - firstTimestamp;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  return `Chart shows ${diffHours} hour${diffHours !== 1 ? 's' : ''} of price data`;
}

// Process price data and return formatted response lines
async function getPriceChartLines() {
  try {
    const priceData = await getPriceData();
    
    if (!priceData || priceData.length === 0) {
      return ["No price data available"];
    }
    
    // Get latest price info
    const latest = priceData[priceData.length - 1];
    const prevDay = priceData.find(d => d.timestamp <= (latest.timestamp - 86400000)) || priceData[0];
    
    // Calculate 24h change
    const priceChange = latest.price - prevDay.price;
    const priceChangePercent = (priceChange / prevDay.price) * 100;
    const priceChangeDirection = priceChangePercent >= 0 ? "^" : "v";
    const priceChangeColor = priceChangePercent >= 0 ? "+" : "";
    
    // Format main metrics
    const currentPrice = `$${latest.price.toFixed(2)}`;
    const priceChangeText = `${priceChangeColor}${priceChangePercent.toFixed(2)}% ${priceChangeDirection}`;
    const volume24h = `24H Volume - $${formatLargeNumber(latest.volume_24h)}`;
    
    // Calculate market cap if available, otherwise use volume as estimate
    const marketCap = latest.market_cap && latest.market_cap > 0 
      ? latest.market_cap 
      : latest.volume_24h * 20; // Rough estimate
    
    const marketCapText = `Market Cap - $${formatLargeNumber(marketCap)}`;
    
    // Get timestamp information
    const currentTime = formatTimestamp(latest.timestamp);
    
    // Create chart
    const chart = createAsciiPriceChart(priceData);
    
    // Get time range text
    const timeRangeText = getTimeRangeText(priceData);
    
    // Construct the complete response
    const response = [
      `SOL Price: ${currentPrice}(${priceChangeText}) (as of ${currentTime})`,
      marketCapText,
      volume24h,
      timeRangeText,
      "",
      ...chart,
      "",
      "Volume data shown corresponds to price movement"
    ];
    
    return response;
  } catch (err) {
    console.error("Failed to process price data:", err.message);
    return ["Error fetching price data. Please try again later."];
  }
}

export default {
  getPriceChartLines
};

