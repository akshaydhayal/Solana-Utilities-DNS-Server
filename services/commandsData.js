// services/commandsData.js
const commands = [
    "epoch-status.cli         - Show current epoch progress",
    "tps-status.cli           - Show Transactions per second(TPS) records",
    "blocktime-status.cli     - Show blocktime metrics records",
    "validators-status.cli    - Show top 10 Solana validators",
    "price-chart.cli          - Show Solana price chart and metrics",
    "solana-supply.cli        - Show Total Solana Supply and Stake Data",
    "dig TXT stake-stats.cli  - Get Solana staking statistics",  
    "help.cli                 - Show this command list"
  ];
  
  function getCommandsList() {
    return [
      "AVAILABLE COMMANDS:",
      "-------------------",
      ...commands
    ];
  }
  
  export default {
    getCommandsList
  };