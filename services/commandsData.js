// services/commandsData.js
const commands = [
  "dig @3.82.20.22 -p 5353 epoch +short               - Show Solana current epoch progress",
  "dig @3.82.20.22 -p 5353 tps +short                 - Show Solana Transactions per second(TPS) records",
  "dig @3.82.20.22 -p 5353 blocktime +short           - Show Solana blocktime metrics records",
  "dig @3.82.20.22 -p 5353 top-validators +short      - Show top 10 Solana validators",
  "dig @3.82.20.22 -p 5353 price-chart +short         - Show Solana price chart and metrics",
  "dig @3.82.20.22 -p 5353 sol-supply +short          - Show Total Solana Supply and Stake Data",
  "dig @3.82.20.22 -p 5353 stake-data +short          - Get Solana staking statistics",  
  "dig @3.82.20.22 -p 5353 stake-graph +short         - Get Solana Stake Growth Over Time",  
  "dig @3.82.20.22 -p 5353 stake-average-size +short  - Get Average SOL Staked size data",  
  "dig @3.82.20.22 -p 5353 help +short                - Show all commands list"
];

function getCommandsList() {
  return [
    "This is a DNS server that takes creative liberties with the DNS protocol to offer handy Solana utilities that are easily accessible via CLI without having to open a clunky search page. Copy and run the below commands to try it out",
    "AVAILABLE DNS COMMANDS FOR SOLANA DATA:",
    "-------------------",
    ...commands
  ];
}

export default {
  getCommandsList
};