import fetch from "node-fetch";

// Cache configuration for Solana data
const cache = {
  supplyData: { data: null, timestamp: 0 },
  apyData: { data: null, timestamp: 0 },
  inflationData: { data: null, timestamp: 0 },
  ttl: 1200000, // Cache TTL in milliseconds (20 minute seconds)
  isExpired(cacheType) {
    return Date.now() - this[cacheType].timestamp > this.ttl;
  }
};

// API endpoints and auth
const SOLANA_SUPPLY_API = "https://api.solanabeach.io/v2/supply-breakdown";
const SOLANA_APY_API = "https://api.solanabeach.io/v1/staking-apy";
const SOLANA_INFLATION_API = "https://api.solanabeach.io/v1/inflation";
const API_KEY = "469ba747-f6d4-4995-a139-46ed89ac001e";

// Format large numbers to millions with one decimal point
function formatToMillions(value) {
  // Convert from lamports to SOL (1 SOL = 10^9 lamports)
  const solValue = value / 1000000000;
  // Convert to millions with 1 decimal point
  return (solValue / 1000000).toFixed(1);
}

// Calculate percentage with one decimal point
function calculatePercentage(part, total) {
  return ((part / total) * 100).toFixed(1);
}

// Format percentage with fixed decimal places
function formatPercentage(value, decimals = 1) {
  return parseFloat(value * 100).toFixed(decimals);
}

// Fetch data from an API with caching
async function fetchWithCache(url, cacheType) {
  // Return cached data if it's not expired
  if (cache[cacheType].data && !cache.isExpired(cacheType)) {
    console.log(`Using cached ${cacheType}`);
    return cache[cacheType].data;
  }

  // Otherwise fetch fresh data
  console.log(`Fetching fresh ${cacheType}`);
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`API response error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();

    // Update cache
    cache[cacheType].data = data;
    cache[cacheType].timestamp = Date.now();

    return data;
  } catch (err) {
    console.error(`Failed to fetch ${cacheType}:`, err.message);

    // Return stale cache if available (better than nothing)
    if (cache[cacheType].data) {
      console.log(`Using stale ${cacheType} cache as fallback`);
      return cache[cacheType].data;
    }
    throw err;
  }
}

// Fetch supply data
async function getSolanaSupplyData() {
  return fetchWithCache(SOLANA_SUPPLY_API, 'supplyData');
}

// Fetch APY data
async function getSolanaApyData() {
  return fetchWithCache(SOLANA_APY_API, 'apyData');
}

// Fetch inflation data
async function getSolanaInflationData() {
  return fetchWithCache(SOLANA_INFLATION_API, 'inflationData');
}

// Render ASCII progress bar
function renderProgressBar(percent, length = 40) {
  const filledLength = Math.round(length * percent / 100);
  const emptyLength = length - filledLength;
  
  return `[${('#').repeat(filledLength)}${('-').repeat(emptyLength)}] ${percent}%`;
}

// Process all data and return formatted response lines
async function getSolanaSupplyStatusLines() {
  try {
    // Fetch all data in parallel
    const [supplyData, apyData, inflationData] = await Promise.all([
      getSolanaSupplyData(),
      getSolanaApyData(),
      getSolanaInflationData()
    ]);
    
    const totalSupply = supplyData.supply.total;
    const circulatingSupply = supplyData.supply.circulating;
    const activeStake = supplyData.stake.effective;
    
    const circulatingM = formatToMillions(circulatingSupply);
    const totalM = formatToMillions(totalSupply);
    const stakeM = formatToMillions(activeStake);
    
    const circulatingPercent = parseFloat(calculatePercentage(circulatingSupply, totalSupply));
    const stakePercent = parseFloat(calculatePercentage(activeStake, totalSupply));
    
    // APY and inflation data
    const apy = formatPercentage(apyData.apy/100, 2);
    const inflation = formatPercentage(inflationData.total, 2);
    const epoch = inflationData.epoch;
    
    // Generate progress bars
    const circulatingBar = renderProgressBar(circulatingPercent);
    const stakeBar = renderProgressBar(stakePercent);
    
    return [
      "SOLANA SUPPLY & STAKE DATA",
      "---------------------",
      `Circulating SOL Supply: ${circulatingM}M SOL  - ${circulatingBar}`,
      `Active Staked SOL: ${stakeM}M SOL       - ${stakeBar}`,
      `Total SOL Supply: ${totalM}M SOL`,
    //   "SOLANA SUPPLY & STAKE DATA",
    //   "---------------------",
    //   `Circulating SOL Supply: ${circulatingM}M SOL`,
    //   `${circulatingBar}`,
    //   `Active Staked SOL: ${stakeM}M SOL`,
    //   `${stakeBar}`,
    //   `Total SOL Supply: ${totalM}M SOL`,
      "---------------------",
      `Current Epoch: ${epoch}`,
      `Staking APY: ${apy}%`,
      `Inflation Rate: ${inflation}%`,
      "---------------------"
    ];
  } catch (err) {
    console.error("Failed to process Solana data:", err.message);
    throw err;
  }
}

export default {
  getSolanaSupplyStatusLines
};


// import fetch from "node-fetch";

// // Cache configuration for Solana supply data
// const cache = {
//   data: null,
//   timestamp: 0,
//   ttl: 60000, // Cache TTL in milliseconds (60 seconds)
//   isExpired() {
//     return Date.now() - this.timestamp > this.ttl;
//   }
// };

// const SOLANA_SUPPLY_API = "https://api.solanabeach.io/v2/supply-breakdown";
// const API_KEY = "469ba747-f6d4-4995-a139-46ed89ac001e";

// // Format large numbers to millions with one decimal point
// function formatToMillions(value) {
//   // Convert from lamports to SOL (1 SOL = 10^9 lamports)
//   const solValue = value / 1000000000;
//   // Convert to millions with 1 decimal point
//   return (solValue / 1000000).toFixed(1);
// }

// // Calculate percentage with one decimal point
// function calculatePercentage(part, total) {
//   return ((part / total) * 100).toFixed(1);
// }

// // Fetch fresh Solana supply data from API or return cached data if valid
// async function getSolanaSupplyData() {
//   // Return cached data if it's not expired
//   if (cache.data && !cache.isExpired()) {
//     console.log("Using cached Solana supply data");
//     return cache.data;
//   }

//   // Otherwise fetch fresh data
//   console.log("Fetching fresh Solana supply data");
//   try {
//     const res = await fetch(SOLANA_SUPPLY_API, {
//       headers: {
//         "Authorization": `Bearer ${API_KEY}`
//       }
//     });
    
//     if (!res.ok) {
//       throw new Error(`API response error: ${res.status} ${res.statusText}`);
//     }
    
//     const data = await res.json();

//     // Update cache
//     cache.data = data;
//     cache.timestamp = Date.now();

//     return data;
//   } catch (err) {
//     console.error("Failed to fetch Solana supply data:", err.message);

//     // Return stale cache if available (better than nothing)
//     if (cache.data) {
//       console.log("Using stale cache as fallback");
//       return cache.data;
//     }
//     throw err;
//   }
// }

// // Render ASCII progress bar
// function renderProgressBar(percent, length = 40) {
//   const filledLength = Math.round(length * percent / 100);
//   const emptyLength = length - filledLength;
  
//   return `[${('#').repeat(filledLength)}${('-').repeat(emptyLength)}] ${percent}%`;
// }

// // Process supply data and return formatted response lines
// async function getSolanaSupplyStatusLines() {
//   try {
//     const data = await getSolanaSupplyData();
    
//     const totalSupply = data.supply.total;
//     const circulatingSupply = data.supply.circulating;
//     const activeStake = data.stake.effective;
    
//     const circulatingM = formatToMillions(circulatingSupply);
//     const totalM = formatToMillions(totalSupply);
//     const stakeM = formatToMillions(activeStake);
    
//     const circulatingPercent = parseFloat(calculatePercentage(circulatingSupply, totalSupply));
//     const stakePercent = parseFloat(calculatePercentage(activeStake, totalSupply));
    
//     // Generate progress bars
//     const circulatingBar = renderProgressBar(circulatingPercent);
//     const stakeBar = renderProgressBar(stakePercent);
    
//     return [
//       "SOLANA SUPPLY & STAKE DATA",
//       "---------------------",
//       `Circulating SOL Supply: ${circulatingM}M SOL  - ${circulatingBar}`,
//       `Active Staked SOL: ${stakeM}M SOL       - ${stakeBar}`,
//       `Total SOL Supply: ${totalM}M SOL`,
//       "---------------------"
//     ];
//   } catch (err) {
//     console.error("Failed to process Solana supply data:", err.message);
//     throw err;
//   }
// }

// export default {
//   getSolanaSupplyStatusLines
// };