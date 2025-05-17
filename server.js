import dgram from "node:dgram";
import dnsPacket from "dns-packet";
import epochService from "./services/epochData.js";
import tpsService from "./services/tpsData.js";
import blocktimeService from "./services/blockTimeData.js";
import validatorsService from "./services/topValidatorsData.js";
import priceChartService from "./services/priceChartData.js";
import solanaSupplyService from "./services/supplyData.js";
import commandsService from "./services/commandsData.js";
import stakeService from "./services/stakeData.js";  // Import the new stake service
import stakeServiceGraph from "./services/stakeGraphData.js";  // Import the new stake service
import stakeServiceAverage from "./services/stakeAverageSizeData.js";  // Import the new stake service

// Create UDP server socket
const server = dgram.createSocket("udp4");

server.on("error", (err) => {
  console.error(`DNS server error: ${err.message}`);
});

server.on("message", async (msg, rinfo) => {
  try {
    const incomingPacket = dnsPacket.decode(msg);
    const question = incomingPacket.questions[0];
    
    console.log(`Received DNS query: ${question.name} (${question.type}) from ${rinfo.address}:${rinfo.port}`);

    // Handle different types of requests
    let lines = [];
    let service = null;

    // Map question names to appropriate services
    if (question.type === "TXT") {
      switch (question.name) {
        case "epoch":
          service = epochService;
          lines = await epochService.getEpochStatus();
          break;
        case "tps":
          service = tpsService;
          lines = await tpsService.getTpsStatusLines();
          break;
        case "blocktime":
          service = blocktimeService;
          lines = await blocktimeService.getBlockTimeStatusLines();
          break;
        case "top-validators":
          service = validatorsService;
          lines = await validatorsService.getTopValidatorsStatusLines();
          break;
        case "price-chart":
          service = priceChartService;
          // Get pre-rendered chart (no async/await here - should return immediately)
          lines = priceChartService.getPriceChartLines();
          console.log(`Retrieved ${lines.length} lines from price chart service`);
          break;
        case "sol-supply":
          service = solanaSupplyService;
          lines = await solanaSupplyService.getSolanaSupplyStatusLines();
          break;
        case "stake-data":  // Add new entry for stake statistics
          service = stakeService;
          lines = await stakeService.getStakeStats();
          break;
        case "stake-graph":  // Add new entry for stake statistics
          service = stakeServiceGraph;
          lines = await stakeServiceGraph.getStakeStatsGraph();
          break;
        case "stake-average-size":  // Add new entry for stake statistics
          service = stakeServiceAverage;
          lines = await stakeServiceAverage.getStakeAverageSize();
          break;
        case "help":
          service = commandsService;
          lines = commandsService.getCommandsList();
          break;
        case "cache-status.cli":
          lines = [
            "Cache Status Information",
            "-----------------------",
            JSON.stringify({
              priceChart: priceChartService.getCacheStatus(),
              stake: stakeService.getCacheStatus()  // Add stake service cache status
            }, null, 2)
          ];
          break;
      }

      // Ensure lines is always an array
      if (!Array.isArray(lines)) {
        console.error(`Service for ${question.name} did not return an array. Got: ${typeof lines}`);
        lines = [`Error: Service data format issue. Please try again later.`];
      }

      // Create a separate answer for each line
      const answers = lines.map(line => ({
        type: "TXT",
        name: question.name,
        class: "IN",
        ttl: 60,
        data: [line] // Each line as a separate TXT record
      }));

      // Send response back to client
      const response = dnsPacket.encode({
        type: "response",
        id: incomingPacket.id,
        questions: [question],
        answers: answers
      });

      server.send(response, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error(`Error sending DNS response to ${rinfo.address}:${rinfo.port}: ${err.message}`);
        } else {
          console.log(`Sent ${answers.length} TXT records to ${rinfo.address}:${rinfo.port}`);
        }
      });
    }
  } catch (err) {
    console.error(`Error processing DNS request: ${err.message}`);
    try {
      // Try to send an error response
      const errorResponse = dnsPacket.encode({
        type: "response",
        id: dnsPacket.decode(msg).id,
        flags: dnsPacket.RECURSION_DESIRED,
        questions: dnsPacket.decode(msg).questions,
        answers: [{
          type: "TXT",
          name: dnsPacket.decode(msg).questions[0].name,
          class: "IN",
          ttl: 60,
          data: ["Error processing request. Please try again."]
        }]
      });
      server.send(errorResponse, rinfo.port, rinfo.address);
    } catch (responseErr) {
      console.error(`Failed to send error response: ${responseErr.message}`);
    }
  }
});

// Handle server startup
server.bind(5353, () => {
  console.log("Solana DNS server running on port 5353 with pre-rendered caching");
});




// import dgram from "node:dgram";
// import dnsPacket from "dns-packet";
// import epochService from "./services/epochData.js";
// import tpsService from "./services/tpsData.js";
// import blocktimeService from "./services/blockTimeData.js";
// import validatorsService from "./services/topValidatorsData.js";
// import priceChartService from "./services/priceChartData.js";
// import solanaSupplyService from "./services/supplyData.js";
// import commandsService from "./services/commandsData.js";

// // Create UDP server socket
// const server = dgram.createSocket("udp4");

// server.on("error", (err) => {
//   console.error(`DNS server error: ${err.message}`);
// });

// server.on("message", async (msg, rinfo) => {
//   try {
//     const incomingPacket = dnsPacket.decode(msg);
//     const question = incomingPacket.questions[0];
    
//     console.log(`Received DNS query: ${question.name} (${question.type}) from ${rinfo.address}:${rinfo.port}`);

//     // Handle different types of requests
//     let lines = [];
//     let service = null;

//     // Map question names to appropriate services
//     if (question.type === "TXT") {
//       switch (question.name) {
//         case "epoch-status.cli":
//           service = epochService;
//           lines = await epochService.getEpochStatus();
//           break;
//         case "tps-status.cli":
//           service = tpsService;
//           lines = await tpsService.getTpsStatusLines();
//           break;
//         case "blocktime-status.cli":
//           service = blocktimeService;
//           lines = await blocktimeService.getBlockTimeStatusLines();
//           break;
//         case "validators-status.cli":
//           service = validatorsService;
//           lines = await validatorsService.getTopValidatorsStatusLines();
//           break;
//         case "price-chart.cli":
//           service = priceChartService;
//           // Get pre-rendered chart (no async/await here - should return immediately)
//           lines = priceChartService.getPriceChartLines();
//           console.log(`Retrieved ${lines.length} lines from price chart service`);
//           break;
//         case "solana-supply.cli":
//           service = solanaSupplyService;
//           lines = await solanaSupplyService.getSolanaSupplyStatusLines();
//           break;
//         case "help.cli":
//           service = commandsService;
//           lines = commandsService.getCommandsList();
//           break;
//         case "cache-status.cli":
//           lines = [
//             "Cache Status Information",
//             "-----------------------",
//             JSON.stringify(priceChartService.getCacheStatus(), null, 2)
//           ];
//           break;
//       }

//       // Ensure lines is always an array
//       if (!Array.isArray(lines)) {
//         console.error(`Service for ${question.name} did not return an array. Got: ${typeof lines}`);
//         lines = [`Error: Service data format issue. Please try again later.`];
//       }

//       // Create a separate answer for each line
//       const answers = lines.map(line => ({
//         type: "TXT",
//         name: question.name,
//         class: "IN",
//         ttl: 60,
//         data: [line] // Each line as a separate TXT record
//       }));

//       // Send response back to client
//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: answers
//       });

//       server.send(response, rinfo.port, rinfo.address, (err) => {
//         if (err) {
//           console.error(`Error sending DNS response to ${rinfo.address}:${rinfo.port}: ${err.message}`);
//         } else {
//           console.log(`Sent ${answers.length} TXT records to ${rinfo.address}:${rinfo.port}`);
//         }
//       });
//     }
//   } catch (err) {
//     console.error(`Error processing DNS request: ${err.message}`);
//     try {
//       // Try to send an error response
//       const errorResponse = dnsPacket.encode({
//         type: "response",
//         id: dnsPacket.decode(msg).id,
//         flags: dnsPacket.RECURSION_DESIRED,
//         questions: dnsPacket.decode(msg).questions,
//         answers: [{
//           type: "TXT",
//           name: dnsPacket.decode(msg).questions[0].name,
//           class: "IN",
//           ttl: 60,
//           data: ["Error processing request. Please try again."]
//         }]
//       });
//       server.send(errorResponse, rinfo.port, rinfo.address);
//     } catch (responseErr) {
//       console.error(`Failed to send error response: ${responseErr.message}`);
//     }
//   }
// });

// // Handle server startup
// server.bind(5353, () => {
//   console.log("Solana DNS server running on port 5353 with pre-rendered caching");
// });






// import dgram from "node:dgram";
// import dnsPacket from "dns-packet";
// import epochService from "./services/epochData.js";
// import tpsService from "./services/tpsData.js";
// import blocktimeService from "./services/blockTimeData.js";
// import validatorsService from "./services/topValidatorsData.js";
// import priceChartService from "./services/priceChartData.js";
// import solanaSupplyService from "./services/supplyData.js";
// import commandsService from "./services/commandsData.js";

// // Create UDP server socket
// const server = dgram.createSocket("udp4");

// server.on("message", async (msg, rinfo) => {
//   const incomingPacket = dnsPacket.decode(msg);
//   const question = incomingPacket.questions[0];

//   // Handle epoch status request
//   if (question.type === "TXT" && question.name === "epoch-status.cli") {
//     try {
//       const lines = await epochService.getEpochStatus();

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
//       console.error("Failed to handle epoch status request:", err.message);
//     }
//   } 
//   // Handle TPS status request
//   else if (question.type === "TXT" && question.name === "tps-status.cli") {
//     try {
//       const lines = await tpsService.getTpsStatusLines();
      
//       // Create a separate answer for each line
//       const answers = lines.map(line => ({
//         type: "TXT",
//         name: question.name,
//         class: "IN",
//         ttl: 60,
//         data: [line] // Each line as a separate TXT record
//       }));

//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: answers
//       });

//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to handle TPS status request:", err.message);
//     }
//   }
//   else if (question.type === "TXT" && question.name === "blocktime-status.cli") {
//     try {
//       const lines = await blocktimeService.getBlockTimeStatusLines();
      
//       // Create a separate answer for each line
//       const answers = lines.map(line => ({
//         type: "TXT",
//         name: question.name,
//         class: "IN",
//         ttl: 60,
//         data: [line] // Each line as a separate TXT record
//       }));

//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: answers
//       });

//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to handle TPS status request:", err.message);
//     }
//   }
//   else if (question.type === "TXT" && question.name === "validators-status.cli") {
//     try {
//       const lines = await validatorsService.getTopValidatorsStatusLines();
      
//       // Create a separate answer for each line
//       const answers = lines.map(line => ({
//         type: "TXT",
//         name: question.name,
//         class: "IN",
//         ttl: 60,
//         data: [line] // Each line as a separate TXT record
//       }));

//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: answers
//       });

//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to handle validators status request:", err.message);
//     }
//   }
//   else if (question.type === "TXT" && question.name === "price-chart.cli") {
//     try {
//       const lines = await priceChartService.getPriceChartLines();
      
//       // Create a separate answer for each line
//       const answers = lines.map(line => ({
//         type: "TXT",
//         name: question.name,
//         class: "IN",
//         ttl: 60,
//         data: [line] // Each line as a separate TXT record
//       }));

//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: answers
//       });

//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to handle price chart request:", err.message);
//     }
//   }
//    // Handle Solana Supply status request
//    else if (question.type === "TXT" && question.name === "solana-supply.cli") {
//     try {
//       const lines = await solanaSupplyService.getSolanaSupplyStatusLines();

//       // Create a separate answer for each line
//       const answers = lines.map(line => ({
//         type: "TXT",
//         name: question.name,
//         class: "IN",
//         ttl: 60,
//         data: [line] // Each line as a separate TXT record
//       }));

//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: answers
//       });

//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to handle Solana supply status request:", err.message);
//     }
//   }
//    // Handle help command
//    else if (question.type === "TXT" && question.name === "help.cli") {
//     try {
//       const lines = commandsService.getCommandsList();
      
//       // Create a separate answer for each line
//       const answers = lines.map(line => ({
//         type: "TXT",
//         name: question.name,
//         class: "IN",
//         ttl: 60,
//         data: [line] // Each line as a separate TXT record
//       }));

//       const response = dnsPacket.encode({
//         type: "response",
//         id: incomingPacket.id,
//         questions: [question],
//         answers: answers
//       });

//       server.send(response, rinfo.port, rinfo.address);
//     } catch (err) {
//       console.error("Failed to handle help command request:", err.message);
//     }
//   }
// });

// // Start the server
// server.bind(5353, () => console.log("Solana DNS server running on port 5353 with on-demand caching"));