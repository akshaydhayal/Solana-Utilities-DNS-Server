import fetch from "node-fetch";

// Cache configuration for epoch data
const cache = {
  data: null,
  timestamp: 0,
  ttl: 600000, // Cache TTL in milliseconds (10 minute)
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }
};

const EPOCH_API = "https://api.stakewiz.com/epoch_info";

// Convert seconds to human-readable time (e.g. 1h 14m)
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// Render ASCII progress bar
function renderEpochBar(percent, epoch, timeLeft) {
  const barLength = 40;
  const filledLength = Math.round(barLength * percent / 100);
  const emptyLength = barLength - filledLength;

  const bar = '#'.repeat(filledLength) + '-'.repeat(emptyLength);

  return [
    `EPOCH ${epoch}             TIME LEFT IN EPOCH`,
    `[${bar}] ${percent.toFixed(1)}%       ${timeLeft} left`
  ];
}

// Fetch fresh epoch data from API or return cached data if valid
async function getEpochData() {
  // Return cached data if it's not expired
  if (cache.data && !cache.isExpired()) {
    console.log("Using cached epoch data");
    return cache.data;
  }

  // Otherwise fetch fresh data
  console.log("Fetching fresh epoch data");
  try {
    const res = await fetch(EPOCH_API);
    const data = await res.json();
    
    // Update cache
    cache.data = data;
    cache.timestamp = Date.now();
    
    return data;
  } catch (err) {
    console.error("Failed to fetch epoch data:", err.message);
    
    // Return stale cache if available (better than nothing)
    if (cache.data) {
      console.log("Using stale cache as fallback");
      return cache.data;
    }
    throw err;
  }
}

// Process epoch data and return formatted response
async function getEpochStatus() {
  try {
    const data = await getEpochData();
    
    // Calculate real-time values even with cached data
    const now = Date.now();
    const elapsedSinceCache = (now - cache.timestamp) / 1000;
    
    // Adjust elapsed and remaining time based on cache age
    const adjustedElapsed = Math.min(
      data.duration_seconds,
      data.elapsed_seconds + elapsedSinceCache
    );
    const adjustedRemaining = Math.max(
      0, 
      data.duration_seconds - adjustedElapsed
    );
    
    // Calculate accurate percentage
    const percent = (adjustedElapsed / data.duration_seconds) * 100;
    const timeLeft = formatTime(adjustedRemaining);
    
    return renderEpochBar(percent, data.epoch, timeLeft);
  } catch (err) {
    console.error("Failed to process epoch data:", err.message);
    throw err;
  }
}

export default {
  getEpochStatus
};