// import dgram from "node:dgram";
// import dnsPacket from "dns-packet";
// import fetch from "node-fetch"; // npm install node-fetch@2

// const server = dgram.createSocket("udp4");

// const EPOCH_API = "https://api.stakewiz.com/epoch_info"; // replace with your real endpoint

// // Cache configuration
// const cache = {
//   data: null,
//   timestamp: 0,
//   ttl: 30000, // Cache TTL in milliseconds (30 seconds)
//   isExpired() {
//     return Date.now() - this.timestamp > this.ttl;
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

// // Fetch fresh data from API or return cached data if valid
// async function getEpochData() {
//   // Return cached data if it's not expired
//   if (cache.data && !cache.isExpired()) {
//     console.log("Using cached epoch data");
//     return cache.data;
//   }

//   // Otherwise fetch fresh data
//   console.log("Fetching fresh epoch data");
//   try {
//     const res = await fetch(EPOCH_API);
//     const data = await res.json();
    
//     // Update cache
//     cache.data = data;
//     cache.timestamp = Date.now();
    
//     return data;
//   } catch (err) {
//     console.error("Failed to fetch epoch data:", err.message);
    
//     // Return stale cache if available (better than nothing)
//     if (cache.data) {
//       console.log("Using stale cache as fallback");
//       return cache.data;
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
//       const elapsedSinceCache = (now - cache.timestamp) / 1000;
      
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
//   }
// });

// // No preloading or background refresh - only fetch on demand

// server.bind(5353, () => console.log("DNS server running on port 5353 with on-demand caching"));




// import dgram from "node:dgram";
// import dnsPacket from "dns-packet";
// import fetch from "node-fetch"; // npm install node-fetch@2

// const server = dgram.createSocket("udp4");

// const EPOCH_API = "https://api.stakewiz.com/epoch_info"; // replace with your real endpoint

// // Cache configuration
// const cache = {
//   data: null,
//   timestamp: 0,
//   ttl: 30000, // Cache TTL in milliseconds (30 seconds)
//   isExpired() {
//     return Date.now() - this.timestamp > this.ttl;
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

// // Fetch fresh data from API or return cached data if valid
// async function getEpochData() {
//   // Return cached data if it's not expired
//   if (cache.data && !cache.isExpired()) {
//     console.log("Using cached epoch data");
//     return cache.data;
//   }

//   // Otherwise fetch fresh data
//   console.log("Fetching fresh epoch data");
//   try {
//     const res = await fetch(EPOCH_API);
//     const data = await res.json();
    
//     // Update cache
//     cache.data = data;
//     cache.timestamp = Date.now();
    
//     return data;
//   } catch (err) {
//     console.error("Failed to fetch epoch data:", err.message);
    
//     // Return stale cache if available (better than nothing)
//     if (cache.data) {
//       console.log("Using stale cache as fallback");
//       return cache.data;
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
//       const elapsedSinceCache = (now - cache.timestamp) / 1000;
      
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
//   }
// });

// // Preload the cache on startup
// getEpochData().catch(err => console.error("Initial cache load failed:", err.message));

// // Set up periodic background refresh to keep cache fresh
// const REFRESH_INTERVAL = 20000; // 20 seconds
// setInterval(() => {
//   getEpochData().catch(err => console.error("Background cache refresh failed:", err.message));
// }, REFRESH_INTERVAL);

// server.bind(5353, () => console.log("DNS server running on port 5353 with caching enabled"));





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







// import dgram from "node:dgram";
// import dnsPacket from "dns-packet";

// const server = dgram.createSocket("udp4");

// // ANSI escape codes for terminal colors and formatting
// const colors = {
//   reset: "\x1b[0m",
//   bright: "\x1b[1m",
//   dim: "\x1b[2m",
//   underscore: "\x1b[4m",
//   blink: "\x1b[5m",
//   reverse: "\x1b[7m",
//   hidden: "\x1b[8m",
  
//   // Foreground colors
//   black: "\x1b[30m",
//   red: "\x1b[31m",
//   green: "\x1b[32m",
//   yellow: "\x1b[33m",
//   blue: "\x1b[34m",
//   magenta: "\x1b[35m",
//   cyan: "\x1b[36m",
//   white: "\x1b[37m",
  
//   // Background colors
//   bgBlack: "\x1b[40m",
//   bgRed: "\x1b[41m",
//   bgGreen: "\x1b[42m",
//   bgYellow: "\x1b[43m",
//   bgBlue: "\x1b[44m",
//   bgMagenta: "\x1b[45m",
//   bgCyan: "\x1b[46m",
//   bgWhite: "\x1b[47m"
// };

// /**
//  * Renders a colorful epoch progress bar using ANSI escape codes
//  */
// function renderEpochBar(percent, epoch, timeLeft) {
//   const barLength = 40;
//   const filledLength = Math.round(barLength * percent / 100);
  
//   // Create a visually appealing progress bar with color blocks
//   let bar = "";
//   for (let i = 0; i < barLength; i++) {
//     if (i < filledLength) {
//       // Magenta filled section
//       bar += `${colors.bgMagenta} ${colors.reset}`;
//     } else {
//       // Dimmed unfilled section
//       bar += `${colors.dim}${colors.bgMagenta}.${colors.reset}`;
//     }
//   }

//   // Format and return the colorful output
//   return [
//     `"${colors.white}EPOCH ${colors.magenta}${epoch}${colors.white}"${" ".repeat(32)}${colors.white}TIME ${colors.green}LEFT${colors.white} IN EPOCH"`,
//     `"[${bar}] ${colors.magenta}${percent}%${colors.reset}${" ".repeat(7)}${colors.white}${timeLeft.split(" ")[0]}${colors.magenta}${timeLeft.split(" ")[1]}${colors.reset} ${colors.green}left${colors.reset}"`
//   ];
// }

// /**
//  * Creates a plain text version of the epoch bar for DNS responses
//  */
// function plainEpochBar(percent, epoch, timeLeft) {
//   const barLength = 40;
//   const filledLength = Math.round(barLength * percent / 100);
  
//   const bar = "#".repeat(filledLength) + "-".repeat(barLength - filledLength);
  
//   return [
//     `"EPOCH ${epoch}                                  TIME LEFT IN EPOCH"`,
//     `"[${bar}] ${percent}%       ${timeLeft} left"`
//   ];
// }

// // Store the epoch data to use consistently
// const epochData = {
//   number: 786,
//   percent: 96,
//   timeLeft: '1h 54m'
// };

// // Simulated database
// const db = {
//   'akshay.dev': { type: 'A', data: '3.4.5.6' },
//   'monika.dev': { type: 'CNAME', data: '4.5.6.7' },
//   'epoch-status.cli': {
//     type: 'TXT',
//     data: plainEpochBar(epochData.percent, epochData.number, epochData.timeLeft)
//   },
//   'epoch-status2.cli': {
//     type: 'TXT',
//     data: renderEpochBar(epochData.percent, epochData.number, epochData.timeLeft)
//   }
// };

// // Custom logging function
// function log(message, type = 'info') {
//   const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
//   let prefix = '';
  
//   switch (type) {
//     case 'info':
//       prefix = `${colors.cyan}[INFO]${colors.reset}`;
//       break;
//     case 'error':
//       prefix = `${colors.red}[ERROR]${colors.reset}`;
//       break;
//     case 'success':
//       prefix = `${colors.green}[SUCCESS]${colors.reset}`;
//       break;
//     case 'query':
//       prefix = `${colors.yellow}[QUERY]${colors.reset}`;
//       break;
//     case 'response':
//       prefix = `${colors.magenta}[RESPONSE]${colors.reset}`;
//       break;
//   }
  
//   console.log(`${colors.dim}${timestamp}${colors.reset} ${prefix} ${message}`);
// }

// // Draw a horizontal line for visual separation
// function drawLine() {
//   console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}`);
// }

// server.on("message", (msg, rinfo) => {
//   const incomingPacket = dnsPacket.decode(msg);
  
//   // Log the incoming query with pretty formatting
//   const queryName = incomingPacket.questions[0]?.name || 'unknown';
//   const queryType = incomingPacket.questions[0]?.type || 'unknown';
//   log(`Query from ${colors.blue}${rinfo.address}:${rinfo.port}${colors.reset} for ${colors.yellow}${queryName}${colors.reset} (${colors.green}${queryType}${colors.reset})`, 'query');
  
//   const name = queryName;
//   const record = db[name];

//   let answers = [];

//   if (record) {
//     answers.push({
//       type: record.type,
//       class: "IN",
//       name: name,
//       data: record.data
//     });
    
//     // Special handling for epoch-status.cli queries
//     if (name === 'epoch-status.cli') {
//       console.clear(); // Clear console for better visibility
      
//       console.log(`\n${colors.bright}${colors.cyan}┌─ Epoch Status Report ─┐${colors.reset}\n`);
      
//       // Display the colorful epoch bar
//       const visualBar = renderEpochBar(
//         epochData.percent,
//         epochData.number,
//         epochData.timeLeft
//       );
      
//       console.log(visualBar.join('\n') + '\n');
      
//       log(`Epoch status visualized for ${colors.yellow}${name}${colors.reset}`, 'success');
//       drawLine();
//     } else {
//       // Standard record response
//       log(`Found ${colors.yellow}${record.type}${colors.reset} record for ${colors.yellow}${name}${colors.reset}: ${colors.green}${JSON.stringify(record.data)}${colors.reset}`, 'response');
//     }
//   } else {
//     log(`No record found for ${colors.yellow}${name}${colors.reset}`, 'error');
//   }

//   const ans = dnsPacket.encode({
//     id: incomingPacket.id,
//     type: 'response',
//     questions: incomingPacket.questions,
//     answers
//   });

//   server.send(ans, rinfo.port, rinfo.address);
// });

// // Start the server
// server.bind(5353, () => {
//   console.clear();
//   log(`DNS server started on port ${colors.green}5353${colors.reset}`, 'success');
//   drawLine();
  
//   // Display available DNS records
//   console.log(`${colors.yellow}Available DNS records:${colors.reset}`);
//   console.log(`• ${colors.cyan}akshay.dev${colors.reset} (A record)`);
//   console.log(`• ${colors.cyan}monika.dev${colors.reset} (CNAME record)`);
//   console.log(`• ${colors.cyan}epoch-status.cli${colors.reset} (Visual TXT record)`);
  
//   console.log(`\n${colors.bright}To see the epoch visualization:${colors.reset}`);
//   console.log(`Run: ${colors.green}dig epoch-status.cli TXT @127.0.0.1 -p 5353${colors.reset}`);
//   drawLine();
  
//   // Show sample visualization
//   console.log(`${colors.bright}${colors.cyan}┌─ Sample Epoch Status Visualization ─┐${colors.reset}\n`);
//   const sampleVisualization = renderEpochBar(epochData.percent, epochData.number, epochData.timeLeft);
//   console.log(sampleVisualization.join('\n') + '\n');
//   drawLine();
// });

// // Handle server shutdown
// process.on('SIGINT', () => {
//   log('Shutting down DNS server...', 'info');
//   server.close(() => {
//     log('Server shut down successfully', 'success');
//     process.exit(0);
//   });
// });