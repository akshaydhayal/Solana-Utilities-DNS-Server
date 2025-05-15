import fetch from "node-fetch";

// Cache configuration for Blocktime data
const cache = {
  data: null,
  timestamp: 0,
  ttl: 120000, // Cache TTL in milliseconds (2 minute)
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }
};

const BLOCKTIME_API = "https://solanacompass.com/statistics/blockTime";

// Render Blocktime data as a table with proper formatting for DNS TXT records
function renderBlockTimeTableWithTimeAgo(blockTime) {
  if (!blockTime || !blockTime[0] || !blockTime[0].data) {
    return ["No Blocktime data available"];
  }

  const data = blockTime[0].data;
  const timeLabels = Object.keys(data);
  const values = Object.values(data);
  
  // Calculate stats
  const avgBlocktime = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  const maxBlocktime = Math.max(...values);
  const minBlocktime = Math.min(...values);
  const currentBlocktime = values[values.length - 1];
  
  // Build the entire table as a single string
  const displayLimit = Math.min(10, timeLabels.length);
  
  // Build the entire table as a single string
  let tableStr = "";
  tableStr += "SOLANA NETWORK BLOCK TIME SUMMARY FOR LAST 1 HOUR\n";
  tableStr += "---------------------------------\n";
  tableStr += `CURRENT BLOCKTIME: ${currentBlocktime}ms\n`;
  tableStr += `AVERAGE BLOCKTIME: ${avgBlocktime} ms\n`;
  tableStr += `MAXIMUM BLOCKTIME: ${maxBlocktime} ms\n`;
  tableStr += `MINIMUM BLOCKTIME: ${minBlocktime}ms\n`;
  tableStr += "TIME AGO     | VALUE\n";
  tableStr += "-------------|----------\n";
  
  // Add data rows
  for (let i = 0; i < displayLimit; i++) {
    // Get data from the most recent entries
    const index = timeLabels.length - displayLimit + i;
    const timeLabel = timeLabels[index];
    const BlocktimeValue = values[index];
    
    // Format the time string to be uniform width
    const formattedTime = timeLabel.padEnd(12);
    
    // Create the table row
    tableStr += `${formattedTime} | ${BlocktimeValue.toString().padStart(5)} ms\n`;
  }
  
  // Return the entire table as a single string
  return [tableStr];
}

// Fetch fresh Blocktime data from API or return cached data if valid
async function getblockTime() {
  // Return cached data if it's not expired
  if (cache.data && !cache.isExpired()) {
    console.log("Using cached Blocktime data");
    return cache.data;
  }

  // Otherwise fetch fresh data
  console.log("Fetching fresh Blocktime data");
  try {
    const res = await fetch(BLOCKTIME_API);
    const data = await res.json();
    
    // Update cache
    cache.data = data;
    cache.timestamp = Date.now();
    
    return data;
  } catch (err) {
    console.error("Failed to fetch Blocktime data:", err.message);
    
    // Return stale cache if available (better than nothing)
    if (cache.data) {
      console.log("Using stale cache as fallback");
      return cache.data;
    }
    throw err;
  }
}

// Process Blocktime data and return formatted response
async function getBlocktimeStatus() {
  try {
    const blockTime = await getblockTime();
    return renderBlockTimeTableWithTimeAgo(blockTime);
  } catch (err) {
    console.error("Failed to process Blocktime data:", err.message);
    throw err;
  }
}

// Process Blocktime data and prepare for DNS response with multiple lines as separate answers
async function getBlockTimeStatusLines() {
  try {
    const blockTime = await getblockTime();
    const tableString = renderBlockTimeTableWithTimeAgo(blockTime);
    
    // Split the single large string into individual lines
    return tableString[0].split("\n").filter(line => line.trim() !== "");
  } catch (err) {
    console.error("Failed to process Blocktime data for multi-line response:", err.message);
    throw err;
  }
}

export default {
  getBlocktimeStatus,
  getBlockTimeStatusLines
};