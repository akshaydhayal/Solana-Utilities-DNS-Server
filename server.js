import dgram from "node:dgram";
import dnsPacket from "dns-packet";
import epochService from "./services/epochData.js";
import tpsService from "./services/tpsData.js";
import blocktimeService from "./services/blockTimeData.js";
import validatorsService from "./services/topValidatorsData.js";
import priceChartService from "./services/priceChartData.js";
import solanaSupplyService from "./services/supplyData.js";

// Create UDP server socket
const server = dgram.createSocket("udp4");

server.on("message", async (msg, rinfo) => {
  const incomingPacket = dnsPacket.decode(msg);
  const question = incomingPacket.questions[0];

  // Handle epoch status request
  if (question.type === "TXT" && question.name === "epoch-status.cli") {
    try {
      const lines = await epochService.getEpochStatus();

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
      console.error("Failed to handle epoch status request:", err.message);
    }
  } 
  // Handle TPS status request
  else if (question.type === "TXT" && question.name === "tps-status.cli") {
    try {
      const lines = await tpsService.getTpsStatusLines();
      
      // Create a separate answer for each line
      const answers = lines.map(line => ({
        type: "TXT",
        name: question.name,
        class: "IN",
        ttl: 60,
        data: [line] // Each line as a separate TXT record
      }));

      const response = dnsPacket.encode({
        type: "response",
        id: incomingPacket.id,
        questions: [question],
        answers: answers
      });

      server.send(response, rinfo.port, rinfo.address);
    } catch (err) {
      console.error("Failed to handle TPS status request:", err.message);
    }
  }
  else if (question.type === "TXT" && question.name === "blocktime-status.cli") {
    try {
      const lines = await blocktimeService.getBlockTimeStatusLines();
      
      // Create a separate answer for each line
      const answers = lines.map(line => ({
        type: "TXT",
        name: question.name,
        class: "IN",
        ttl: 60,
        data: [line] // Each line as a separate TXT record
      }));

      const response = dnsPacket.encode({
        type: "response",
        id: incomingPacket.id,
        questions: [question],
        answers: answers
      });

      server.send(response, rinfo.port, rinfo.address);
    } catch (err) {
      console.error("Failed to handle TPS status request:", err.message);
    }
  }
  else if (question.type === "TXT" && question.name === "validators-status.cli") {
    try {
      const lines = await validatorsService.getTopValidatorsStatusLines();
      
      // Create a separate answer for each line
      const answers = lines.map(line => ({
        type: "TXT",
        name: question.name,
        class: "IN",
        ttl: 60,
        data: [line] // Each line as a separate TXT record
      }));

      const response = dnsPacket.encode({
        type: "response",
        id: incomingPacket.id,
        questions: [question],
        answers: answers
      });

      server.send(response, rinfo.port, rinfo.address);
    } catch (err) {
      console.error("Failed to handle validators status request:", err.message);
    }
  }
  else if (question.type === "TXT" && question.name === "price-chart.cli") {
    try {
      const lines = await priceChartService.getPriceChartLines();
      
      // Create a separate answer for each line
      const answers = lines.map(line => ({
        type: "TXT",
        name: question.name,
        class: "IN",
        ttl: 60,
        data: [line] // Each line as a separate TXT record
      }));

      const response = dnsPacket.encode({
        type: "response",
        id: incomingPacket.id,
        questions: [question],
        answers: answers
      });

      server.send(response, rinfo.port, rinfo.address);
    } catch (err) {
      console.error("Failed to handle price chart request:", err.message);
    }
  }
   // Handle Solana Supply status request
   else if (question.type === "TXT" && question.name === "solana-supply.cli") {
    try {
      const lines = await solanaSupplyService.getSolanaSupplyStatusLines();

      // Create a separate answer for each line
      const answers = lines.map(line => ({
        type: "TXT",
        name: question.name,
        class: "IN",
        ttl: 60,
        data: [line] // Each line as a separate TXT record
      }));

      const response = dnsPacket.encode({
        type: "response",
        id: incomingPacket.id,
        questions: [question],
        answers: answers
      });

      server.send(response, rinfo.port, rinfo.address);
    } catch (err) {
      console.error("Failed to handle Solana supply status request:", err.message);
    }
  }
});

// Start the server
server.bind(5353, () => console.log("DNS server running on port 5353 with on-demand caching"));