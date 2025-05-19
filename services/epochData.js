import fetch from "node-fetch";

// Modified cache configuration for pre-rendered epoch info
const cache = {
  data: null,           // Raw API data
  renderedOutput: null, // Pre-rendered output
  timestamp: 0,
  ttl: 600000,         // Cache TTL in milliseconds (10 minutes)
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

// Fetch fresh epoch data from API
async function fetchEpochData() {
  console.log(`Fetching fresh epoch data at ${new Date().toISOString()}`);
  try {
    const res = await fetch(EPOCH_API);
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch epoch data:", err.message);
    throw err;
  }
}

// Process epoch data and return formatted response
function renderEpochStatus(data) {
  if (!data) {
    return ["No epoch data available"];
  }
  
  // Calculate real-time values
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
  
  // Additional epoch information for enhanced display
  const epochInfo = [
    `Epoch ${data.epoch} - ${percent.toFixed(1)}% complete`,
    `Started: ${new Date(data.start_time * 1000).toLocaleString()}`,
    `Ends: ${new Date((data.start_time + data.duration_seconds) * 1000).toLocaleString()}`,
  ];
  
  // Create the progress bar and combine with epoch info
  const progressBar = renderEpochBar(percent, data.epoch, timeLeft);
  
  return [
    ...progressBar,
    // "",
    // ...epochInfo
  ];
}

// Function to update the cache with fresh data and pre-render the output
async function updateCache() {
  try {
    const freshData = await fetchEpochData();
    const renderedOutput = renderEpochStatus(freshData);
    
    // Update cache
    cache.data = freshData;
    cache.renderedOutput = renderedOutput;
    cache.timestamp = Date.now();
    
    console.log(`Epoch Cache data updated successfully at ${new Date().toLocaleString()}`);
    return true;
  } catch (err) {
    console.error("Failed to update epoch cache:", err.message);
    return false;
  }
}

// Function to get the pre-rendered epoch status
function getEpochStatus() {
  // If cache is empty or expired but we have stale data, return the stale data
  // while triggering a background refresh
  if (cache.renderedOutput && cache.isExpired()) {
    console.log("Cache is expired but returning stale data while refreshing");
    updateCache().catch(err => {
      console.error("Background cache refresh failed:", err.message);
    });
    
    // Calculate real-time values with the stale data
    if (cache.data) {
      return renderEpochStatus(cache.data);
    }
    
    // Return the stale pre-rendered output if we can't recalculate
    return cache.renderedOutput;
  }
  
  // If we have valid cached data, return it
  if (cache.renderedOutput) {
    // Always recalculate with the latest time values for accuracy
    if (cache.data) {
      return renderEpochStatus(cache.data);
    }
    return cache.renderedOutput;
  }
  
  // If we have no data at all, return a message
  return ["Loading epoch data. Please try again shortly."];
}

// Initialize the cache on module load
async function initializeCache() {
  console.log("Initializing epoch cache with first data load");
  await updateCache();
  
  // Set up periodic cache refresh every 10 minutes
  setInterval(updateCache, cache.ttl);
}

// Run the initial cache load
initializeCache().catch(err => {
  console.error("Failed to initialize epoch cache:", err.message);
});

export default {
  getEpochStatus,
  forceRefresh: updateCache  // Expose a method to force refresh if needed
};