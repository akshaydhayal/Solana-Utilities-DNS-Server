# Solana DNS Protocol

A lightweight protocol that delivers Solana blockchain data through standard DNS queries. Get real-time Solana statistics without installing any dependencies or SDK - query directly from your command line.

## Overview

This DNS-based service allows you to retrieve Solana blockchain data using simple `dig` or `nslookup` commands from any terminal. The service runs a specialized DNS server that responds to specific domain queries with Solana network statistics, formatted as TXT records.

## Getting Started

No installation required! Just use standard DNS tools available on your system:

**Using dig:**

```dig @3.82.20.22 -p 5353 <command> TXT +short```

## Available Commands

### `epoch`: Provides current Solana epoch information.

**Command:**
```dig @3.82.20.22 -p 5353 epoch TXT +short ```

**Response format:**
```
"EPOCH 788             TIME LEFT IN EPOCH"
"[############----------------------------] 30.2%       33h 6m left"
```
### `tps`
Retrieves current and historical transactions per second statistics.

**Example:**
dig @localhost -p 5353 tps TXT

**Response format:**
"Current TPS: 2,567"
"Peak TPS (24h): 4,123"
"Average TPS (1h): 1,987"

### `blocktime`
Shows block time statistics.

**Example:**
dig @localhost -p 5353 blocktime TXT

**Response format:**
"Current blocktime: 0.43s"
"Average blocktime (24h): 0.47s"
"Slowest blocktime (24h): 0.82s"

### `top-validators`
Lists information about top validators.

**Example:**
dig @localhost -p 5353 top-validators TXT

**Response format:**
"Validator Name | Stake (SOL) | Commission"
"----------------|------------|------------"
"Validator1     | 1,234,567  | 8%"
"Validator2     | 987,654    | 5%"

### `price-chart`
Displays an ASCII chart of recent SOL price movements.

**Example:**
dig @localhost -p 5353 price-chart TXT

**Response format:**
"SOL/USD Price Last 24h"
"╭───────────────────────────────────────╮"
"│         $48.92                        │"
"│    ✕        ✕       ✕    ✕            │"
"│  ✕  ✕    ✕     ✕       ✕   ✕   ✕      │"
"│                             ✕     ✕   │"
"│                                       │"
"╰───────────────────────────────────────╯"
"$45.23                           $48.92"

### `sol-supply`
Shows Solana supply statistics.

**Example:**
dig @localhost -p 5353 sol-supply TXT

**Response format:**
"Total Supply: 555,123,456 SOL"
"Circulating Supply: 345,123,456 SOL"
"Staked Supply: 234,567,890 SOL (68%)"

### `stake-data`
Provides detailed staking statistics.

**Example:**
dig @localhost -p 5353 stake-data TXT

**Response format:**
"Total Stake: 234,567,890 SOL"
"Active Stakes: 23,456"
"Stake % of Supply: 68%"
"Total Delegators: 123,456"

### `stake-graph`
Displays an ASCII chart of stake distribution.

**Example:**
dig @localhost -p 5353 stake-graph TXT

**Response format:**
"Stake Distribution by Validator Size"
"╭───────────────────────────────────────╮"
"│ ███                                   │"
"│ ███████                               │"
"│ █████████████                         │"
"│ ███████████████████                   │"
"╰───────────────────────────────────────╯"
"Top 10     Top 50     Top 100    Others"

### `stake-average-size`
Shows average stake size statistics.

**Example:**
dig @localhost -p 5353 stake-average-size TXT

**Response format:**
"Average Stake Size: 9,876 SOL"
"Median Stake Size: 5,432 SOL"
"Largest Stake: 234,567 SOL"
"Smallest Active Stake: 1 SOL"

### `help`
Lists all available commands.

**Example:**
dig @localhost -p 5353 help TXT

**Response format:**
"Available commands:"
"  epoch - Current epoch information"
"  tps - Transaction performance stats"
"  blocktime - Block time statistics"
"  top-validators - List of top validators"
"  price-chart - SOL price visualization"
"  sol-supply - Solana token supply info"
"  stake-data - Staking statistics"
"  stake-graph - Stake distribution visualization"
"  stake-average-size - Average stake sizes"
"  help - This command list"

### `cache-status.cli`
Shows internal cache status (for debugging).

**Example:**
dig @localhost -p 5353 cache-status.cli TXT

**Response format:**
"Cache Status Information"
"-----------------------"
"{"priceChart":{"lastUpdated":"2025-05-17T10:15:23Z"},"stake":{"lastUpdated":"2025-05-17T10:14:12Z"}}"

## Self-Hosting

To run this service yourself:

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the server with `node server.js`

The DNS server will start on port 5353 by default.

## How It Works

The system works by:
1. Running a special DNS server that listens for specific queries
2. When a query matches a supported command, it fetches the relevant Solana data
3. Data is formatted as TXT records and returned through the DNS response
4. The client's standard DNS tools display the results directly in the terminal

This approach allows for cross-platform compatibility without requiring any special software installation.

## Technical Notes

- Data is cached to minimize API calls to Solana RPC endpoints
- The service uses UDP on port 5353 by default
- Each line of output is returned as a separate TXT record

## License

[MIT License](LICENSE)
