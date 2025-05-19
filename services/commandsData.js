// services/commandsData.js
const commands = [
  "dig @3.82.20.22 -p 5353 epoch TXT +short               - Show Solana current epoch progress",
  "dig @3.82.20.22 -p 5353 tps TXT +short                 - Show Solana Transactions per second(TPS) records",
  "dig @3.82.20.22 -p 5353 blocktime TXT +short           - Show Solana blocktime metrics records",
  "dig @3.82.20.22 -p 5353 top-validators TXT +short      - Show top 10 Solana validators",
  "dig @3.82.20.22 -p 5353 price-chart TXT +short         - Show Solana price chart and metrics",
  "dig @3.82.20.22 -p 5353 sol-supply TXT +short          - Show Total Solana Supply and Stake Data",
  "dig @3.82.20.22 -p 5353 stake-data TXT +short          - Get Solana staking statistics",  
  "dig @3.82.20.22 -p 5353 stake-graph TXT +short         - Get Solana Stake Growth Over Time",  
  "dig @3.82.20.22 -p 5353 stake-average-size TXT +short  - Get Average SOL Staked size data",  
  "dig @3.82.20.22 -p 5353 help TXT +short                - Show all commands list"
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