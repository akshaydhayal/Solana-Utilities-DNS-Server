import fetch from "node-fetch";

// Enhanced cache configuration for pre-rendered stake data
const cache = {
  data: null,           // Raw API data
  renderedStats: null,  // Pre-rendered stats output
  timestamp: 0,
  ttl: 1200000,         // Cache TTL in milliseconds (20 minutes)
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }
};

const STAKE_API = "https://solanacompass.com/stats";
const API_TOKEN = "469ba747-f6d4-4995-a139-46ed89ac001e";

// Helper function to format lamports to SOL with proper formatting
function formatLamports(lamports) {
  const sol = lamports / 1_000_000_000;
  if (sol >= 1_000_000) {
    return (sol / 1_000_000).toFixed(2) + "M";
  } else if (sol >= 1_000) {
    return (sol / 1_000).toFixed(2) + "K";
  } else {
    return sol.toFixed(2);
  }
}

// Helper function to convert lamports to USD (assuming 1 SOL = $176.53, adjust as needed)
function lamportsToUSD(lamports) {
  const solPrice = 176.53; // Example price, should be fetched in real implementation
  return (lamports / 1_000_000_000) * solPrice;
}

// Helper function to format dollar amounts
function formatDollars(amount) {
  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(2) + "B";
  } else if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(2) + "M";
  } else if (amount >= 1_000) {
    return (amount / 1_000).toFixed(2) + "K";
  } else {
    return amount.toFixed(2);
  }
}

// Function to render the staking overview
function renderStakingOverview(stakeData) {
  if (!stakeData || !stakeData.stats) {
    return ["No stake data available"];
  }

  const stats = stakeData.stats;
  
  // Build the overview section
  let overviewStr = "";
  overviewStr += "SOLANA NETWORK STAKING STATISTICS\n";
  overviewStr += "---------------------------------\n";
  overviewStr += `TOTAL STAKED: ${formatLamports(stats.total)} SOL ($${formatDollars(lamportsToUSD(stats.total))})\n`;
  overviewStr += `ACTIVE STAKERS: ${stats.num_active.toLocaleString()}\n`;
  overviewStr += `UNIQUE WALLETS: ${stats.wallets.toLocaleString()}\n`;
  overviewStr += `BIGGEST STAKE: ${formatLamports(stats.max)} SOL ($${formatDollars(lamportsToUSD(stats.max))})\n`;
  overviewStr += `MEDIAN STAKE: ${formatLamports(stats.median)} SOL ($${formatDollars(lamportsToUSD(stats.median))})\n`;
  overviewStr += `MEAN STAKE: ${formatLamports(stats.mean)} SOL ($${formatDollars(lamportsToUSD(stats.mean))})\n`;
  overviewStr += `FILTER APY: ${(stats.filterApy * 100).toFixed(2)}%\n`;
  overviewStr += `UPDATED: ${stats.updated}\n`;
  
  return overviewStr.split("\n").filter(line => line.trim() !== "");
}

// Horizontal Bar Chart for epoch data
function renderHorizontalBarChart(stakeData) {
  if (!stakeData || !stakeData.epochCharts || !stakeData.epochCharts.balance) {
    return ["No epoch balance data available"];
  }

  const balanceData = stakeData.epochCharts.balance.data;
  const epochs = Object.keys(balanceData).sort((a, b) => parseInt(a) - parseInt(b));
  
  // Get min and max values for scaling
  const values = Object.values(balanceData).map(Number);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue;
  
  let output = "";
  // output += "================================================================\n\n\n";
  output += "SOLANA STAKE GROWTH OVER TIME (EPOCHS VS BALANCE)\n";
  output += "---------------------------------\n";
  
  // Select a subset of epochs to display (to keep output manageable)
  const displayCount = 12; // Number of epochs to display
  const step = Math.max(1, Math.floor(epochs.length / displayCount));
  const displayEpochs = [];
  
  for (let i = 0; i < epochs.length; i += step) {
    if (displayEpochs.length < displayCount) {
      displayEpochs.push(epochs[i]);
    }
  }
  
  // Ensure the last epoch is included
  if (displayEpochs[displayEpochs.length - 1] !== epochs[epochs.length - 1]) {
    displayEpochs.push(epochs[epochs.length - 1]);
  }
  
  // Maximum width for the bars
  const maxBarWidth = 50;
  
  // Display each epoch as a horizontal bar
  for (const epoch of displayEpochs) {
    const value = balanceData[epoch];
    const normalizedValue = (value - minValue) / (range || 1);
    const barWidth = Math.max(1, Math.floor(normalizedValue * maxBarWidth));
    
    // Create the bar with a suitable character
    const bar = "-".repeat(barWidth);
    
    // Pad the epoch number for alignment
    const paddedEpoch = epoch.padStart(2);
    
    output += `Epoch ${paddedEpoch} - ${(value/1000000).toFixed(2)}M SOL: ${bar} \n`;
  }
  
  output += "\n Stake SOL Range: ";
  output += `MIN ${(minValue/1000000).toFixed(2)}M SOL - MAX ${(maxValue/1000000).toFixed(2)}M SOL`;
  
  return output.split("\n");
}

// Function to render stake size distribution table with combined ranges
function renderStakeSizeTable(stakeData) {
  if (!stakeData || !stakeData.stake_amounts) {
    return ["No stake amount data available"];
  }

  const originalStakeAmounts = stakeData.stake_amounts;
  
  // Create a map to store the combined ranges
  const combinedRanges = new Map();
  
  // Process each stake range
  for (const sizeRange of originalStakeAmounts) {
    let key;
    
    // Determine the key for this range based on the from-to values
    // This is where we implement the combining logic
    if (sizeRange.from >= 100 && sizeRange.from < 1000) {
      // Combine 100-500 and 500-1000 into 100-1000
      key = "100-1000";
    } else if (sizeRange.from >= 1000 && sizeRange.from < 10000) {
      // Combine 1000-5000 and 5000-10000 into 1000-10000
      key = "1000-10000";
    } else {
      // Keep other ranges as they are
      key = `${sizeRange.from}-${sizeRange.to}`;
    }
    
    // Initialize the combined range if it doesn't exist
    if (!combinedRanges.has(key)) {
      combinedRanges.set(key, {
        from: sizeRange.from,
        to: key === "100-1000" ? 1000 : 
            key === "1000-10000" ? 10000 : sizeRange.to,
        sum: 0,
        num_stakes: 0,
        wallets: 0,
        unique_validators: 0
      });
    }
    
    // Add the stats from this range to the combined range
    const combinedRange = combinedRanges.get(key);
    combinedRange.sum += sizeRange.sum;
    combinedRange.num_stakes += sizeRange.num_stakes;
    combinedRange.wallets += sizeRange.wallets;
    
    // For unique validators, we can't simply add them as there might be overlaps
    // Instead, we'll take the maximum as an approximation
    combinedRange.unique_validators = Math.max(
      combinedRange.unique_validators, 
      sizeRange.unique_validators
    );
  }
  
  // Convert the map to an array and sort by the "from" value
  const stakeAmounts = Array.from(combinedRanges.values())
    .sort((a, b) => a.from - b.from);
  
  // Build the table header
  let tableStr = "";
  tableStr += "\n";
  tableStr += "\n\n AVERAGE SOL STAKED SIZES\n";
  tableStr += "\n";
  tableStr += "SOL RANGE         | TOTAL SOL STAKED      | NUM STAKES | WALLETS   | VALIDATORS\n";
  tableStr += "------------------|-------------------|------------|-----------|----------\n";
  
  // Add data rows
  for (const sizeRange of stakeAmounts) {
    const fromStr = sizeRange.from.toString().padStart(6);
    const toStr = sizeRange.to === 99999999 ? "99999999" : sizeRange.to.toString();
    const rangeStr = `${fromStr} - ${toStr.padEnd(8)}`;
    
    const totalStaked = formatLamports(sizeRange.sum);
    const percentage = ((sizeRange.sum / stakeData.stats.total) * 100).toFixed(2);
    
    const numStakes = sizeRange.num_stakes.toLocaleString().padStart(10);
    const wallets = sizeRange.wallets.toLocaleString().padStart(9);
    const validators = sizeRange.unique_validators.toLocaleString().padStart(10);
    
    // Create the table row
    tableStr += `${rangeStr} | ${totalStaked} (${percentage}%) | ${numStakes} | ${wallets} | ${validators}\n`;
  }
  
  return tableStr.split("\n").filter(line => line.trim() !== "");
}

// Fetch fresh stake data from API
async function fetchStakeData() {
  console.log(`Fetching fresh stake data at ${new Date().toISOString()}`);
  try {
    const res = await fetch(STAKE_API, {
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch stake data:", err.message);
    throw err;
  }
}

// Process stake data and return formatted response lines
async function renderStakeStats(stakeData) {
  if (!stakeData) {
    return ["No stake data available"];
  }
  
  try {
    // Combine all sections
    const overview = renderStakingOverview(stakeData);
    const epochChart = renderHorizontalBarChart(stakeData);
    const sizeTable = renderStakeSizeTable(stakeData);
    
    // Add last updated timestamp
    const lastUpdateLine = [`Last updated: ${new Date().toLocaleString()}`];
    
    // Return combined output
    // return [...overview, "", ...epochChart, "", ...sizeTable, "", ...lastUpdateLine];
    // return [...sizeTable, "", ...lastUpdateLine];
    return [...sizeTable];
  } catch (err) {
    console.error("Failed to render stake stats:", err.message);
    return ["Error processing stake statistics. Please try again later."];
  }
}

// Function to update the cache with fresh data and pre-render the stats
async function updateCache() {
  try {
    const freshData = await fetchStakeData();
    const renderedStats = await renderStakeStats(freshData);
    
    // Update cache
    cache.data = freshData;
    cache.renderedStats = renderedStats;
    cache.timestamp = Date.now();

    console.log(`Stake average size data cached successfully at ${new Date().toLocaleString()}`);
    return true;
  } catch (err) {
    console.error("Failed to update stake average size cache:", err.message);
    return false;
  }
}

// Function to get the pre-rendered stake stats
function getStakeAverageSize() {
  // If cache is empty or expired but we have stale data, return the stale data
  // while triggering a background refresh
  if (cache.renderedStats && cache.isExpired()) {
    console.log("Cache is expired but returning stale data while refreshing");
    updateCache().catch(err => {
      console.error("Background cache refresh failed:", err.message);
    });
    
    // Return the stale data immediately
    return cache.renderedStats;
  }

  // If we have valid cached data, return it
  if (cache.renderedStats) {
    return cache.renderedStats;
  }

  // If we have no data at all, return a message
  return ["Loading stake data. Please try again shortly."];
}

// Initialize the cache on module load
async function initializeCache() {
  console.log("Initializing cache with first data load");
  await updateCache();
  
  // Set up periodic cache refresh every 20 minutes (same as TTL)
  setInterval(updateCache, cache.ttl);
}

// Run the initial cache load
initializeCache().catch(err => {
  console.error("Failed to initialize cache:", err.message);
});

export default {
  getStakeAverageSize,
  forceRefresh: updateCache,  // Expose a method to force refresh if needed
  getCacheStatus: () => ({
    hasData: !!cache.data,
    hasRenderedStats: !!cache.renderedStats,
    lastUpdated: cache.timestamp > 0 ? new Date(cache.timestamp).toISOString() : 'never',
    isExpired: cache.isExpired(),
    ttl: cache.ttl / 1000 / 60 + ' minutes'
  })
};
