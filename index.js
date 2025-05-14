import dgram from "node:dgram";
import dnsPacket from "dns-packet";
import fetch from "node-fetch"; // npm install node-fetch@2

const server = dgram.createSocket("udp4");

const EPOCH_API = "https://api.stakewiz.com/epoch_info"; // replace with your real endpoint
const TPS_API = "https://solanacompass.com/statistics/tps"; // replace with your actual TPS API endpoint

// Cache configuration
const cache = {
  epochData: null,
  epochTimestamp: 0,
  tpsData: null,
  tpsTimestamp: 0,
  ttl: 30000, // Cache TTL in milliseconds (30 seconds)
  isEpochExpired() {
    return Date.now() - this.epochTimestamp > this.ttl;
  },
  isTpsExpired() {
    return Date.now() - this.tpsTimestamp > this.ttl;
  }
};

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
  
  // We'll return a single, well-structured string for the entire table
  const displayLimit = Math.min(10, timeLabels.length);
  
  // Build the entire table as a single string
  let tableStr = "";
  tableStr += "SOLANA NETWORK TRANSACTION PER SECOND(TPS) SUMMARY FOR LAST 1 HOUR\n";
  tableStr += "---------------------------------\n";
  tableStr += `CURRENT TPS: ${currentTps}\n`;
  tableStr += `AVERAGE TPS: ${avgTps}\n`;
  tableStr += `MAXIMUM TPS: ${maxTps}\n`;
  tableStr += `MINIMUM TPS: ${minTps}\n`;
//   tableStr += `TOTAL SAMPLES: ${values.length}\n`;
//   tableStr += "---------------------------------\n";
//   tableStr += `\nDETAILED TPS DATA (LAST ${displayLimit} SAMPLES)\n`;
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

// Fetch fresh epoch data from API or return cached data if valid
async function getEpochData() {
  // Return cached data if it's not expired
  if (cache.epochData && !cache.isEpochExpired()) {
    console.log("Using cached epoch data");
    return cache.epochData;
  }

  // Otherwise fetch fresh data
  console.log("Fetching fresh epoch data");
  try {
    const res = await fetch(EPOCH_API);
    const data = await res.json();
    
    // Update cache
    cache.epochData = data;
    cache.epochTimestamp = Date.now();
    
    return data;
  } catch (err) {
    console.error("Failed to fetch epoch data:", err.message);
    
    // Return stale cache if available (better than nothing)
    if (cache.epochData) {
      console.log("Using stale cache as fallback");
      return cache.epochData;
    }
    throw err;
  }
}

// Fetch fresh TPS data from API or return cached data if valid
async function getTpsData() {
  // Return cached data if it's not expired
  if (cache.tpsData && !cache.isTpsExpired()) {
    console.log("Using cached TPS data");
    return cache.tpsData;
  }

  // Otherwise fetch fresh data
  console.log("Fetching fresh TPS data");
  try {
    const res = await fetch(TPS_API);
    const data = await res.json();
    
    // Update cache
    cache.tpsData = data;
    cache.tpsTimestamp = Date.now();
    
    return data;
  } catch (err) {
    console.error("Failed to fetch TPS data:", err.message);
    
    // Return stale cache if available (better than nothing)
    if (cache.tpsData) {
      console.log("Using stale cache as fallback");
      return cache.tpsData;
    }
    throw err;
  }
}

server.on("message", async (msg, rinfo) => {
  const incomingPacket = dnsPacket.decode(msg);
  const question = incomingPacket.questions[0];

  if (question.type === "TXT" && question.name === "epoch-status.cli") {
    try {
      const data = await getEpochData();
      
      // Calculate real-time values even with cached data
      const now = Date.now();
      const elapsedSinceCache = (now - cache.epochTimestamp) / 1000;
      
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
      const lines = renderEpochBar(percent, data.epoch, timeLeft);

      const response = dnsPacket.encode({
        type: "response",
        id: incomingPacket.id,
        questions: [question],
        answers: [{
          type: "TXT",
          name: question.name,
          class: "IN",
          ttl: 60,
          data: lines
        }]
      });

      server.send(response, rinfo.port, rinfo.address);
    } catch (err) {
      console.error("Failed to process epoch data:", err.message);
    }
  } else if (question.type === "TXT" && question.name === "tps-status.cli") {
    try {
      const tpsData = await getTpsData();
      const tableString = renderTpsTableWithTimeAgo(tpsData);
      
      // Since we have a single large string, let's prepare to split it into lines
      // and send multiple answers in a format that will render well in the client
      const lines = tableString[0].split("\n");
      const answers = [];
      
      // Send each line as a separate answer
      for (const line of lines) {
        if (line.trim() !== "") {  // Skip empty lines
          answers.push({
            type: "TXT",
            name: question.name,
            class: "IN",
            ttl: 60,
            data: [line]  // Each line as a separate TXT record
          });
        }
      }
  
      const response = dnsPacket.encode({
        type: "response",
        id: incomingPacket.id,
        questions: [question],
        answers: answers
      });
  
      server.send(response, rinfo.port, rinfo.address);
    } catch (err) {
      console.error("Failed to process TPS data:", err.message);
    }
  }
});

// No preloading or background refresh - only fetch on demand

server.bind(5353, () => console.log("DNS server running on port 5353 with on-demand caching"));


// import dgram from "node:dgram";
// import dnsPacket from "dns-packet";
// import fetch from "node-fetch"; // npm install node-fetch@2

// const server = dgram.createSocket("udp4");

// // const EPOCH_API = "https://api.stakewiz.com/epoch_info"; // replace with your real endpoint
// // const TPS_API = "https://solanacompass.com/statistics/tps"; // replace with your actual TPS API endpoint
// const EPOCH_API = "https://api.stakewiz.com/epoch_info"; // replace with your real endpoint
// const TPS_API = "https://solanacompass.com/statistics/tps"; // replace with your actual TPS API endpoint

// // Cache configuration
// const cache = {
//   epochData: null,
//   epochTimestamp: 0,
//   tpsData: null,
//   tpsTimestamp: 0,
//   ttl: 30000, // Cache TTL in milliseconds (30 seconds)
//   isEpochExpired() {
//     return Date.now() - this.epochTimestamp > this.ttl;
//   },
//   isTpsExpired() {
//     return Date.now() - this.tpsTimestamp > this.ttl;
//   }
// };

// // Convert seconds to human-readable time (e.g. 1h 14m)
// function formatTime(seconds) {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   return `${h}h ${m}m`;
// }

// // Render ASCII progress bar
// function renderEpochBar(percent, epoch, timeLeft) {
//   const barLength = 40;
//   const filledLength = Math.round(barLength * percent / 100);
//   const emptyLength = barLength - filledLength;

//   const bar = '#'.repeat(filledLength) + '-'.repeat(emptyLength);

//   return [
//     `EPOCH ${epoch}             TIME LEFT IN EPOCH`,
//     `[${bar}] ${percent.toFixed(1)}%       ${timeLeft} left`
//   ];
// }

// // Render TPS data as a table with proper formatting for DNS TXT records
// function renderTpsTableWithTimeAgo(tpsData) {
//   if (!tpsData || !tpsData[0] || !tpsData[0].data) {
//     return ["No TPS data available"];
//   }

//   const data = tpsData[0].data;
//   // Since the API returns data with keys like "60 mins ago", we'll use these directly
//   const timeLabels = Object.keys(data);
//   const values = Object.values(data);
  
//   // Calculate stats
//   const avgTps = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
//   const maxTps = Math.max(...values);
//   const minTps = Math.min(...values);
//   const currentTps = values[values.length - 1];
  
//   // Create summary - each line as a separate string in the array
//   const tableOutput = [];
//   tableOutput.push("SOLANA NETWORK TPS SUMMARY");
//   tableOutput.push("---------------------------------");
//   tableOutput.push(`CURRENT TPS: ${currentTps}`);
//   tableOutput.push(`AVERAGE TPS: ${avgTps}`);
//   tableOutput.push(`MAXIMUM TPS: ${maxTps}`);
//   tableOutput.push(`MINIMUM TPS: ${minTps}`);
//   tableOutput.push(`TOTAL SAMPLES: ${values.length}`);
//   tableOutput.push("---------------------------------");
  
//   // Create data table
//   // Show most recent data points, up to 20
//   const displayLimit = Math.min(20, timeLabels.length);
  
//   // Add table title and headers
//   tableOutput.push(`DETAILED TPS DATA (LAST ${displayLimit} SAMPLES)`);
//   tableOutput.push("TIME AGO     | VALUE");
//   tableOutput.push("-------------|---------");
  
//   // Add data rows - each row as a separate string in the array
//   for (let i = 0; i < displayLimit; i++) {
//     // Get data from the most recent entries
//     const index = timeLabels.length - displayLimit + i;
//     const timeLabel = timeLabels[index];
//     const tpsValue = values[index];
    
//     // Format the time string to be uniform width
//     const formattedTime = timeLabel.padEnd(12);
    
//     // Create the table row
//     tableOutput.push(`${formattedTime} | ${tpsValue.toString().padStart(5)} TPS`);
//   }
  
//   return tableOutput;
// }

// // Fetch fresh epoch data from API or return cached data if valid
// async function getEpochData() {
//   // Return cached data if it's not expired
//   if (cache.epochData && !cache.isEpochExpired()) {
//     console.log("Using cached epoch data");
//     return cache.epochData;
//   }

//   // Otherwise fetch fresh data
//   console.log("Fetching fresh epoch data");
//   try {
//     const res = await fetch(EPOCH_API);
//     const data = await res.json();
    
//     // Update cache
//     cache.epochData = data;
//     cache.epochTimestamp = Date.now();
    
//     return data;
//   } catch (err) {
//     console.error("Failed to fetch epoch data:", err.message);
    
//     // Return stale cache if available (better than nothing)
//     if (cache.epochData) {
//       console.log("Using stale cache as fallback");
//       return cache.epochData;
//     }
//     throw err;
//   }
// }

// // Fetch fresh TPS data from API or return cached data if valid
// async function getTpsData() {
//   // Return cached data if it's not expired
//   if (cache.tpsData && !cache.isTpsExpired()) {
//     console.log("Using cached TPS data");
//     return cache.tpsData;
//   }

//   // Otherwise fetch fresh data
//   console.log("Fetching fresh TPS data");
//   try {
//     const res = await fetch(TPS_API);
//     const data = await res.json();
    
//     // Update cache
//     cache.tpsData = data;
//     cache.tpsTimestamp = Date.now();
    
//     return data;
//   } catch (err) {
//     console.error("Failed to fetch TPS data:", err.message);
    
//     // Return stale cache if available (better than nothing)
//     if (cache.tpsData) {
//       console.log("Using stale cache as fallback");
//       return cache.tpsData;
//     }
//     throw err;
//   }
// }

// server.on("message", async (msg, rinfo) => {
//   const incomingPacket = dnsPacket.decode(msg);
//   const question = incomingPacket.questions[0];

//   if (question.type === "TXT" && question.name === "epoch-status.cli") {
//     try {
//       const data = await getEpochData();
      
//       // Calculate real-time values even with cached data
//       const now = Date.now();
//       const elapsedSinceCache = (now - cache.epochTimestamp) / 1000;
      
//       // Adjust elapsed and remaining time based on cache age
//       const adjustedElapsed = Math.min(
//         data.duration_seconds,
//         data.elapsed_seconds + elapsedSinceCache
//       );
//       const adjustedRemaining = Math.max(
//         0, 
//         data.duration_seconds - adjustedElapsed
//       );
      
//       // Calculate accurate percentage
//       const percent = (adjustedElapsed / data.duration_seconds) * 100;
//       const timeLeft = formatTime(adjustedRemaining);
//       const lines = renderEpochBar(percent, data.epoch, timeLeft);

//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: [{
//           type: "TXT",
//           name: question.name,
//           class: "IN",
//           ttl: 60,
//           data: lines
//         }]
//       });

//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to process epoch data:", err.message);
//     }
//   } else if (question.type === "TXT" && question.name === "tps-status.cli") {
//     try {
//       const tpsData = await getTpsData();
//       const tableLines = renderTpsTableWithTimeAgo(tpsData);
  
//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: [{
//           type: "TXT",
//           name: question.name,
//           class: "IN",
//           ttl: 60,
//           data: tableLines  // This returns an array of strings, one line per element
//         }]
//       });
  
//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to process TPS data:", err.message);
//     }
//   }
// });

// // No preloading or background refresh - only fetch on demand

// server.bind(5353, () => console.log("DNS server running on port 5353 with on-demand caching"));




// import dgram from "node:dgram";
// import dnsPacket from "dns-packet";
// import fetch from "node-fetch"; // npm install node-fetch@2

// const server = dgram.createSocket("udp4");

// const EPOCH_API = "https://api.stakewiz.com/epoch_info"; // replace with your real endpoint
// const TPS_API = "https://solanacompass.com/statistics/tps"; // replace with your actual TPS API endpoint

// // Cache configuration
// const cache = {
//   epochData: null,
//   epochTimestamp: 0,
//   tpsData: null,
//   tpsTimestamp: 0,
//   ttl: 30000, // Cache TTL in milliseconds (30 seconds)
//   isEpochExpired() {
//     return Date.now() - this.epochTimestamp > this.ttl;
//   },
//   isTpsExpired() {
//     return Date.now() - this.tpsTimestamp > this.ttl;
//   }
// };

// // Convert seconds to human-readable time (e.g. 1h 14m)
// function formatTime(seconds) {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   return `${h}h ${m}m`;
// }

// // Render ASCII progress bar
// function renderEpochBar(percent, epoch, timeLeft) {
//   const barLength = 40;
//   const filledLength = Math.round(barLength * percent / 100);
//   const emptyLength = barLength - filledLength;

//   const bar = '#'.repeat(filledLength) + '-'.repeat(emptyLength);

//   return [
//     `EPOCH ${epoch}             TIME LEFT IN EPOCH`,
//     `[${bar}] ${percent.toFixed(1)}%       ${timeLeft} left`
//   ];
// }

//   // Render TPS data as a table with proper timestamp formatting
// function renderTpsTableWithTimeAgo(tpsData) {
//     if (!tpsData || !tpsData[0] || !tpsData[0].data) {
//       return ["No TPS data available"];
//     }
  
//     const data = tpsData[0].data;
//     // Since the API returns data with keys like "60 mins ago", we'll use these directly
//     const timeLabels = Object.keys(data);
//     const values = Object.values(data);
    
//     // Calculate stats
//     const avgTps = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
//     const maxTps = Math.max(...values);
//     const minTps = Math.min(...values);
//     const currentTps = values[values.length - 1];
    
//     // Create summary
//     const tableOutput = [];
//     tableOutput.push("SOLANA NETWORK TPS SUMMARY");
//     tableOutput.push("---------------------------------");
//     tableOutput.push(`CURRENT TPS: ${currentTps}`);
//     tableOutput.push(`AVERAGE TPS: ${avgTps}`);
//     tableOutput.push(`MAXIMUM TPS: ${maxTps}`);
//     tableOutput.push(`MINIMUM TPS: ${minTps}`);
//     tableOutput.push(`TOTAL SAMPLES: ${values.length}`);
//     tableOutput.push("---------------------------------");
    
//     // Create data table
//     // Show most recent data points, up to 20
//     const displayLimit = Math.min(20, timeLabels.length);
    
//     // Add table title and headers
//     tableOutput.push(`DETAILED TPS DATA (LAST ${displayLimit} SAMPLES)`);
//     tableOutput.push("TIME AGO     | VALUE");
//     tableOutput.push("-------------|---------");
    
//     // Add data rows - ONE ROW PER LINE
//     for (let i = 0; i < displayLimit; i++) {
//       // Get data from the most recent entries
//       const index = timeLabels.length - displayLimit + i;
//       const timeLabel = timeLabels[index];
//       const tpsValue = values[index];
      
//       // Format the time string to be uniform width
//       const formattedTime = timeLabel.padEnd(12);
      
//       // Create the table row
//       tableOutput.push(`${formattedTime} | ${tpsValue.toString().padStart(5)} TPS`);
//     }
    
//     return tableOutput;
//   }

// // Fetch fresh epoch data from API or return cached data if valid
// async function getEpochData() {
//   // Return cached data if it's not expired
//   if (cache.epochData && !cache.isEpochExpired()) {
//     console.log("Using cached epoch data");
//     return cache.epochData;
//   }

//   // Otherwise fetch fresh data
//   console.log("Fetching fresh epoch data");
//   try {
//     const res = await fetch(EPOCH_API);
//     const data = await res.json();
    
//     // Update cache
//     cache.epochData = data;
//     cache.epochTimestamp = Date.now();
    
//     return data;
//   } catch (err) {
//     console.error("Failed to fetch epoch data:", err.message);
    
//     // Return stale cache if available (better than nothing)
//     if (cache.epochData) {
//       console.log("Using stale cache as fallback");
//       return cache.epochData;
//     }
//     throw err;
//   }
// }

// // Fetch fresh TPS data from API or return cached data if valid
// async function getTpsData() {
//   // Return cached data if it's not expired
//   if (cache.tpsData && !cache.isTpsExpired()) {
//     console.log("Using cached TPS data");
//     return cache.tpsData;
//   }

//   // Otherwise fetch fresh data
//   console.log("Fetching fresh TPS data");
//   try {
//     const res = await fetch(TPS_API);
//     const data = await res.json();
    
//     // Update cache
//     cache.tpsData = data;
//     cache.tpsTimestamp = Date.now();
    
//     return data;
//   } catch (err) {
//     console.error("Failed to fetch TPS data:", err.message);
    
//     // Return stale cache if available (better than nothing)
//     if (cache.tpsData) {
//       console.log("Using stale cache as fallback");
//       return cache.tpsData;
//     }
//     throw err;
//   }
// }

// server.on("message", async (msg, rinfo) => {
//   const incomingPacket = dnsPacket.decode(msg);
//   const question = incomingPacket.questions[0];

//   if (question.type === "TXT" && question.name === "epoch-status.cli") {
//     try {
//       const data = await getEpochData();
      
//       // Calculate real-time values even with cached data
//       const now = Date.now();
//       const elapsedSinceCache = (now - cache.epochTimestamp) / 1000;
      
//       // Adjust elapsed and remaining time based on cache age
//       const adjustedElapsed = Math.min(
//         data.duration_seconds,
//         data.elapsed_seconds + elapsedSinceCache
//       );
//       const adjustedRemaining = Math.max(
//         0, 
//         data.duration_seconds - adjustedElapsed
//       );
      
//       // Calculate accurate percentage
//       const percent = (adjustedElapsed / data.duration_seconds) * 100;
//       const timeLeft = formatTime(adjustedRemaining);
//       const lines = renderEpochBar(percent, data.epoch, timeLeft);

//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: [{
//           type: "TXT",
//           name: question.name,
//           class: "IN",
//           ttl: 60,
//           data: lines
//         }]
//       });

//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to process epoch data:", err.message);
//     }
//   } if (question.type === "TXT" && question.name === "tps-status.cli") {
//     try {
//       const tpsData = await getTpsData();
//       const tableLines = renderTpsTableWithTimeAgo(tpsData);
  
//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: [{
//           type: "TXT",
//           name: question.name,
//           class: "IN",
//           ttl: 60,
//           data: tableLines
//         }]
//       });
  
//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to process TPS data:", err.message);
//     }
//   }
// });

// // No preloading or background refresh - only fetch on demand

// server.bind(5353, () => console.log("DNS server running on port 5353 with on-demand caching"));







// import dgram from "node:dgram";
// import dnsPacket from "dns-packet";
// import fetch from "node-fetch"; // npm install node-fetch@2

// const server = dgram.createSocket("udp4");

// const EPOCH_API = "https://api.stakewiz.com/epoch_info"; // replace with your real endpoint

// // Convert seconds to human-readable time (e.g. 1h 14m)
// function formatTime(seconds) {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   return `${h}h ${m}m`;
// }

// // Render ASCII progress bar
// function renderEpochBar(percent, epoch, timeLeft) {
//   const barLength = 40;
//   const filledLength = Math.round(barLength * percent / 100);
//   const emptyLength = barLength - filledLength;

//   const bar = '#'.repeat(filledLength) + '-'.repeat(emptyLength);

//   return [
//     `EPOCH ${epoch}             TIME LEFT IN EPOCH`,
//     `[${bar}] ${percent.toFixed(1)}%       ${timeLeft} left`
//   ];
// }

// server.on("message", async (msg, rinfo) => {
//   const incomingPacket = dnsPacket.decode(msg);
//   const question = incomingPacket.questions[0];

//   if (question.type === "TXT" && question.name === "epoch-status.cli") {
//     try {
//       const res = await fetch(EPOCH_API);
//       const data = await res.json();

//       const percent = (data.elapsed_seconds / data.duration_seconds) * 100;
//       const timeLeft = formatTime(data.remaining_seconds);
//       const lines = renderEpochBar(percent, data.epoch, timeLeft);

//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: [{
//           type: "TXT",
//           name: question.name,
//           class: "IN",
//           ttl: 60,
//           data: lines
//         }]
//       });

//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to fetch epoch data:", err.message);
//     }
//   }
// });

// server.bind(5353, () => console.log("DNS server running on port 5353"));