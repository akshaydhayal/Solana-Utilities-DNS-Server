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
  output += "================================================================\n\n\n";
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

// Function to render stake size distribution table
function renderStakeSizeTable(stakeData) {
  if (!stakeData || !stakeData.stake_amounts) {
    return ["No stake amount data available"];
  }

  const stakeAmounts = stakeData.stake_amounts;
  
  // Build the table header
  let tableStr = "";
  tableStr += "================================================================";
  tableStr += "\n";

  tableStr += "\n\n AVERAGE STAKE SIZES\n";
  tableStr += "---------------------------------\n";
  tableStr += "SOL RANGE         | TOTAL STAKED      | NUM STAKES | WALLETS   | VALIDATORS\n";
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
    return [...epochChart];
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

    console.log(`Stake Cache data updated successfully at ${new Date().toLocaleString()}`);
    return true;
  } catch (err) {
    console.error("Failed to update cache:", err.message);
    return false;
  }
}

// Function to get the pre-rendered stake stats
// function getStakeStatsLines() {
function getStakeStatsGraph() {
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
//   getStakeStatsLines,
  getStakeStatsGraph,
  forceRefresh: updateCache,  // Expose a method to force refresh if needed
  getCacheStatus: () => ({
    hasData: !!cache.data,
    hasRenderedStats: !!cache.renderedStats,
    lastUpdated: cache.timestamp > 0 ? new Date(cache.timestamp).toISOString() : 'never',
    isExpired: cache.isExpired(),
    ttl: cache.ttl / 1000 / 60 + ' minutes'
  })
};




// import fetch from "node-fetch";

// // Cache configuration for stake data
// const cache = {
//   data: null,
//   timestamp: 0,
//   ttl: 300000, // Cache TTL in milliseconds (5 minutes)
//   isExpired() {
//     return Date.now() - this.timestamp > this.ttl;
//   }
// };

// const STAKE_API = "https://solanacompass.com/stats";
// const API_TOKEN = "469ba747-f6d4-4995-a139-46ed89ac001e";

// // Function to render the staking overview
// function renderStakingOverview(stakeData) {
//   if (!stakeData || !stakeData.stats) {
//     return ["No stake data available"];
//   }

//   const stats = stakeData.stats;
  
//   // Build the overview section
//   let overviewStr = "";
//   overviewStr += "SOLANA NETWORK STAKING STATISTICS\n";
//   overviewStr += "---------------------------------\n";
//   overviewStr += `TOTAL STAKED: ${formatLamports(stats.total)} SOL ($${formatDollars(lamportsToUSD(stats.total))})\n`;
//   overviewStr += `ACTIVE STAKERS: ${stats.num_active.toLocaleString()}\n`;
//   overviewStr += `UNIQUE WALLETS: ${stats.wallets.toLocaleString()}\n`;
//   overviewStr += `BIGGEST STAKE: ${formatLamports(stats.max)} SOL ($${formatDollars(lamportsToUSD(stats.max))})\n`;
//   overviewStr += `MEDIAN STAKE: ${formatLamports(stats.median)} SOL ($${formatDollars(lamportsToUSD(stats.median))})\n`;
//   overviewStr += `MEAN STAKE: ${formatLamports(stats.mean)} SOL ($${formatDollars(lamportsToUSD(stats.mean))})\n`;
//   overviewStr += `FILTER APY: ${(stats.filterApy * 100).toFixed(2)}%\n`;
//   overviewStr += `UPDATED: ${stats.updated}\n`;
  
//   return overviewStr.split("\n").filter(line => line.trim() !== "");
// }

// // Function to render the epoch balance chart
// function renderEpochBalanceChart(stakeData) {
//   if (!stakeData || !stakeData.epochCharts || !stakeData.epochCharts.balance) {
//     return ["No epoch balance data available"];
//   }

//   const balanceData = stakeData.epochCharts.balance.data;
//   const epochs = Object.keys(balanceData).sort((a, b) => parseInt(a) - parseInt(b));
  
//   // Get min and max values for scaling
//   const values = Object.values(balanceData);
//   const maxValue = Math.max(...values);
//   const minValue = Math.min(...values);
//   const range = maxValue - minValue;
  
//   // Chart configuration
//   const chartHeight = 10;
//   const chartWidth = Math.min(epochs.length, 50);
  
//   // Create the chart header
//   let chartStr = "";
//   chartStr += "\nSTAKE BALANCE OVER EPOCHS\n";
//   chartStr += "---------------------------------\n";
  
//   // Create the chart body
//   const chart = Array(chartHeight).fill().map(() => Array(chartWidth).fill(' '));
  
//   // Plot the data points
//   for (let i = 0; i < chartWidth; i++) {
//     const epochIndex = epochs.length - chartWidth + i;
//     if (epochIndex >= 0) {
//       const epoch = epochs[epochIndex];
//       const value = balanceData[epoch];
      
//       // Calculate the vertical position
//       const normalizedValue = range === 0 ? 0 : (value - minValue) / range;
//       const yPos = Math.floor((1 - normalizedValue) * (chartHeight - 1));
      
//       // Set the data point
//       if (yPos >= 0 && yPos < chartHeight) {
//         chart[yPos][i] = '*';
//       }
//     }
//   }
  
//   // Convert the chart array to a string
//   for (let y = 0; y < chartHeight; y++) {
//     chartStr += chart[y].join('') + '\n';
//   }
  
//   // Add the x-axis
//   chartStr += '-'.repeat(chartWidth) + '\n';
  
//   // Add epochs markers
//   let xAxisLabels = '';
//   for (let i = 0; i < chartWidth; i += Math.ceil(chartWidth / 5)) {
//     const epochIndex = epochs.length - chartWidth + i;
//     if (epochIndex >= 0) {
//       const epoch = epochs[epochIndex];
//       const padding = ' '.repeat(Math.max(0, i - epoch.length / 2));
//       xAxisLabels += padding + epoch;
//     }
//   }
//   chartStr += xAxisLabels + '\n';
  
//   // Add value range indicators
//   chartStr += `MIN: ${formatLamports(minValue)} SOL  MAX: ${formatLamports(maxValue)} SOL\n`;
  
//   return chartStr.split("\n").filter(line => line.trim() !== "");
// }

// // Function to render stake size distribution table
// function renderStakeSizeTable(stakeData) {
//   if (!stakeData || !stakeData.stake_amounts) {
//     return ["No stake amount data available"];
//   }

//   const stakeAmounts = stakeData.stake_amounts;
  
//   // Build the table header
//   let tableStr = "";
//   tableStr += "\nAVERAGE STAKE SIZES\n";
//   tableStr += "---------------------------------\n";
//   tableStr += "SOL RANGE         | TOTAL STAKED      | NUM STAKES | WALLETS   | VALIDATORS\n";
//   tableStr += "------------------|-------------------|------------|-----------|----------\n";
  
//   // Add data rows
//   for (const sizeRange of stakeAmounts) {
//     const fromStr = sizeRange.from.toString().padStart(6);
//     const toStr = sizeRange.to === 99999999 ? "99999999" : sizeRange.to.toString();
//     const rangeStr = `${fromStr} - ${toStr.padEnd(8)}`;
    
//     const totalStaked = formatLamports(sizeRange.sum);
//     const percentage = ((sizeRange.sum / stakeData.stats.total) * 100).toFixed(2);
    
//     const numStakes = sizeRange.num_stakes.toLocaleString().padStart(10);
//     const wallets = sizeRange.wallets.toLocaleString().padStart(9);
//     const validators = sizeRange.unique_validators.toLocaleString().padStart(10);
    
//     // Create the table row
//     tableStr += `${rangeStr} | ${totalStaked} (${percentage}%) | ${numStakes} | ${wallets} | ${validators}\n`;
//   }
  
//   return tableStr.split("\n").filter(line => line.trim() !== "");
// }

// // Helper function to format lamports to SOL with proper formatting
// function formatLamports(lamports) {
//   const sol = lamports / 1_000_000_000;
//   if (sol >= 1_000_000) {
//     return (sol / 1_000_000).toFixed(2) + "M";
//   } else if (sol >= 1_000) {
//     return (sol / 1_000).toFixed(2) + "K";
//   } else {
//     return sol.toFixed(2);
//   }
// }

// // Helper function to convert lamports to USD (assuming 1 SOL = $176.53, adjust as needed)
// function lamportsToUSD(lamports) {
//   const solPrice = 176.53; // Example price, should be fetched in real implementation
//   return (lamports / 1_000_000_000) * solPrice;
// }

// // Helper function to format dollar amounts
// function formatDollars(amount) {
//   if (amount >= 1_000_000_000) {
//     return (amount / 1_000_000_000).toFixed(2) + "B";
//   } else if (amount >= 1_000_000) {
//     return (amount / 1_000_000).toFixed(2) + "M";
//   } else if (amount >= 1_000) {
//     return (amount / 1_000).toFixed(2) + "K";
//   } else {
//     return amount.toFixed(2);
//   }
// }

// // Fetch fresh stake data from API or return cached data if valid
// async function getStakeData() {
//   // Return cached data if it's not expired
//   if (cache.data && !cache.isExpired()) {
//     console.log("Using cached stake data");
//     return cache.data;
//   }

//   // Otherwise fetch fresh data
//   console.log("Fetching fresh stake data");
//   try {
//     const res = await fetch(STAKE_API, {
//       headers: {
//         "Authorization": `Bearer ${API_TOKEN}`
//       }
//     });
//     const data = await res.json();
    
//     // Update cache
//     cache.data = data;
//     cache.timestamp = Date.now();
    
//     return data;
//   } catch (err) {
//     console.error("Failed to fetch stake data:", err.message);
    
//     // Return stale cache if available (better than nothing)
//     if (cache.data) {
//       console.log("Using stale cache as fallback");
//       return cache.data;
//     }
//     throw err;
//   }
// }

// // Function to get all stake stats formatted for DNS response
// async function getStakeStats() {
//   try {
//     const stakeData = await getStakeData();
    
//     // Combine all sections
//     const overview = renderStakingOverview(stakeData);
//     const epochChart = renderEpochBalanceChart(stakeData);
//     const sizeTable = renderStakeSizeTable(stakeData);
    
//     return [...overview, ...epochChart, ...sizeTable];
//   } catch (err) {
//     console.error("Failed to process stake data:", err.message);
//     return ["Error fetching stake statistics. Please try again later."];
//   }
// }

// export default {
//   getStakeStats,
//   getCacheStatus: () => ({
//     hasData: !!cache.data,
//     lastUpdated: cache.timestamp > 0 ? new Date(cache.timestamp).toISOString() : 'never',
//     isExpired: cache.isExpired()
//   })
// };