import dgram from "node:dgram";
import dnsPacket from "dns-packet";
import epochService from "./services/epochData.js";
import tpsService from "./services/tpsData.js";
import blocktimeService from "./services/blockTimeData.js";
import validatorsService from "./services/topValidatorsData.js";
import priceChartService from "./services/priceChartData.js";
import solanaSupplyService from "./services/supplyData.js";
import commandsService from "./services/commandsData.js";
import stakeService from "./services/stakeData.js";
import stakeServiceGraph from "./services/stakeGraphData.js";
import stakeServiceAverage from "./services/stakeAverageSizeData.js";

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
    // Removed the question.type === "TXT" condition to process any query type
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
        lines = priceChartService.getPriceChartLines();
        console.log(`Retrieved ${lines.length} lines from price chart service`);
        break;
      case "sol-supply":
        service = solanaSupplyService;
        lines = await solanaSupplyService.getSolanaSupplyStatusLines();
        break;
      case "stake-data":
        service = stakeService;
        lines = await stakeService.getStakeStats();
        break;
      case "stake-graph":
        service = stakeServiceGraph;
        lines = await stakeServiceGraph.getStakeStatsGraph();
        break;
      case "stake-average-size":
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
            stake: stakeService.getCacheStatus()
          }, null, 2)
        ];
        break;
      default:
        lines = ["Unknown command. Use 'dig @3.82.20.22 -p 5353 help +short' to see available commands."];
        break;
    }

    // Ensure lines is always an array
    if (!Array.isArray(lines)) {
      console.error(`Service for ${question.name} did not return an array. Got: ${typeof lines}`);
      lines = ["Error: Service data format issue. Please try again later."];
    }

    // Create a separate answer for each line - always as TXT records
    const answers = lines.map(line => ({
      type: "TXT", // We'll still return TXT records regardless of what was requested
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