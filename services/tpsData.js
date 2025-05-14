import fetch from "node-fetch";

// Cache configuration for TPS data
const cache = {
  data: null,
  timestamp: 0,
  ttl: 120000, // Cache TTL in milliseconds (30 seconds)
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }
};

const TPS_API = "https://solanacompass.com/statistics/tps";

// Render TPS data as a table with proper formatting for DNS TXT records
function renderTpsTableWithTimeAgo(tpsData) {
  if (!tpsData || !tpsData[0] || !tpsData[0].data) {
    return ["No TPS data available"];
  }

  const data = tpsData[0].data;
  const timeLabels = Object.keys(data);
  const values = Object.values(data);
  
  // Calculate stats
  const avgTps = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  const maxTps = Math.max(...values);
  const minTps = Math.min(...values);
  const currentTps = values[values.length - 1];
  
  // Build the entire table as a single string
  const displayLimit = Math.min(10, timeLabels.length);
  
  // Build the entire table as a single string
  let tableStr = "";
  tableStr += "SOLANA NETWORK TRANSACTION PER SECOND(TPS) SUMMARY FOR LAST 1 HOUR\n";
  tableStr += "---------------------------------\n";
  tableStr += `CURRENT TPS: ${currentTps}\n`;
  tableStr += `AVERAGE TPS: ${avgTps}\n`;
  tableStr += `MAXIMUM TPS: ${maxTps}\n`;
  tableStr += `MINIMUM TPS: ${minTps}\n`;
  tableStr += "TIME AGO     | VALUE\n";
  tableStr += "-------------|----------\n";
  
  // Add data rows
  for (let i = 0; i < displayLimit; i++) {
    // Get data from the most recent entries
    const index = timeLabels.length - displayLimit + i;
    const timeLabel = timeLabels[index];
    const tpsValue = values[index];
    
    // Format the time string to be uniform width
    const formattedTime = timeLabel.padEnd(12);
    
    // Create the table row
    tableStr += `${formattedTime} | ${tpsValue.toString().padStart(5)} TPS\n`;
  }
  
  // Return the entire table as a single string
  return [tableStr];
}

// Fetch fresh TPS data from API or return cached data if valid
async function getTpsData() {
  // Return cached data if it's not expired
  if (cache.data && !cache.isExpired()) {
    console.log("Using cached TPS data");
    return cache.data;
  }

  // Otherwise fetch fresh data
  console.log("Fetching fresh TPS data");
  try {
    const res = await fetch(TPS_API);
    const data = await res.json();
    
    // Update cache
    cache.data = data;
    cache.timestamp = Date.now();
    
    return data;
  } catch (err) {
    console.error("Failed to fetch TPS data:", err.message);
    
    // Return stale cache if available (better than nothing)
    if (cache.data) {
      console.log("Using stale cache as fallback");
      return cache.data;
    }
    throw err;
  }
}

// Process TPS data and return formatted response
async function getTpsStatus() {
  try {
    const tpsData = await getTpsData();
    return renderTpsTableWithTimeAgo(tpsData);
  } catch (err) {
    console.error("Failed to process TPS data:", err.message);
    throw err;
  }
}

// Process TPS data and prepare for DNS response with multiple lines as separate answers
async function getTpsStatusLines() {
  try {
    const tpsData = await getTpsData();
    const tableString = renderTpsTableWithTimeAgo(tpsData);
    
    // Split the single large string into individual lines
    return tableString[0].split("\n").filter(line => line.trim() !== "");
  } catch (err) {
    console.error("Failed to process TPS data for multi-line response:", err.message);
    throw err;
  }
}

export default {
  getTpsStatus,
  getTpsStatusLines
};