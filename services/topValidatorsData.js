import fetch from "node-fetch";

// Cache configuration for validators data
const cache = {
  data: null,
  timestamp: 0,
  ttl: 600000, // Cache TTL in milliseconds (1 minute)
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }
};

const VALIDATORS_API = "https://api.solanabeach.io/v1/validators/top";
const API_KEY = "469ba747-f6d4-4995-a139-46ed89ac001e";

// Format stake amount to human-readable format
function formatStake(rawStake) {
  const solAmount = rawStake / 1000000000; // Convert lamports to SOL
  if (solAmount >= 1000000) {
    return `${(solAmount / 1000000).toFixed(2)}M SOL`;
  } else if (solAmount >= 1000) {
    return `${(solAmount / 1000).toFixed(2)}K SOL`;
  }
  return `${solAmount.toFixed(2)} SOL`;
}

// Fetch fresh validators data from API or return cached data if valid
async function getValidatorsData() {
  // Return cached data if it's not expired
  if (cache.data && !cache.isExpired()) {
    console.log("Using cached validators data");
    return cache.data;
  }

  // Otherwise fetch fresh data
  console.log("Fetching fresh validators data");
  try {
    const res = await fetch(VALIDATORS_API, {
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
    console.error("Failed to fetch validators data:", err.message);
    
    // Return stale cache if available (better than nothing)
    if (cache.data) {
      console.log("Using stale cache as fallback");
      return cache.data;
    }
    throw err;
  }
}

// Process validators data and return formatted response lines
async function getTopValidatorsStatusLines() {
  try {
    const data = await getValidatorsData();
    
    // Only take the top 10 validators
    const top10 = data.slice(0, 10);
    
    // Format the response
    const lines = [
      "TOP 10 SOLANA VALIDATORS",
      "------------------------"
    ];
    
    top10.forEach((validator, index) => {
      const name = validator.moniker || "Unknown";
      const stake = formatStake(validator.activatedStake);
      const commission = `${validator.commission}%`;
      const delegators = validator.delegatorCount.toLocaleString();
      
      lines.push(`${index + 1}. ${name} - ${stake} - ${commission} commission - ${delegators} delegators`);
    });
    
    return lines;
  } catch (err) {
    console.error("Failed to process validators data:", err.message);
    return ["Error fetching validators data. Please try again later."];
  }
}

export default {
  getTopValidatorsStatusLines
};