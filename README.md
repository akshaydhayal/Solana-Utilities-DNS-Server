# Solana Data Utilities DNS Server

A lightweight protocol that delivers Solana blockchain data through standard DNS queries. Get real-time Solana statistics without installing any dependencies or SDK - query directly from your command line.

## Overview

This DNS-based service allows you to retrieve Solana blockchain data using simple `dig` or `nslookup` commands from any terminal. The service runs a specialized DNS server that responds to specific domain queries with Solana network statistics, formatted as TXT records.

## Getting Started

No installation required! Just use standard DNS tools available on your system:

**Using dig:**

```dig @3.82.20.22 -p 5353 <command> TXT +short```

## Video Demo:

[https://www.loom.com/share/45a00c1596c342a3b86950f2d685cada?sid=ac1e460e-576d-4394-b8af-e53e0e935c31
](https://www.loom.com/share/45a00c1596c342a3b86950f2d685cada?sid=ac1e460e-576d-4394-b8af-e53e0e935c31
)


## Available Commands

### `epoch`: 
Provides current Solana epoch information.

**Command:**
```dig @3.82.20.22 -p 5353 epoch TXT +short ```

**Response format:**
```
"EPOCH 788             TIME LEFT IN EPOCH"
"[############----------------------------] 30.2%       33h 6m left"
```
### `tps`
Retrieves transactions per second(TPS) statistics for last 1 hour.

**Example:**
```dig @3.82.20.22 -p 5353 tps TXT +short```

**Response format:**
```
"SOLANA NETWORK TRANSACTION PER SECOND(TPS) SUMMARY FOR LAST 1 HOUR"
"---------------------------------"
"CURRENT TPS: 4147"
"AVERAGE TPS: 4161"
"MAXIMUM TPS: 4309"
"MINIMUM TPS: 3993"
"TIME AGO     | VALUE"
"-------------|----------"
"11 mins ago  |  4194 TPS"
"10 mins ago  |  4116 TPS"
"9 mins ago   |  4270 TPS"
"8 mins ago   |  4153 TPS"
"7 mins ago   |  4077 TPS"
"6 mins ago   |  4228 TPS"
"5 mins ago   |  4201 TPS"
"4 mins ago   |  4256 TPS"
"3 mins ago   |  4309 TPS"
"2 mins ago   |  4147 TPS"
```

### `blocktime`
Shows block time statistics for the last 1 hour.

**Example:**
```dig @3.82.20.22 -p 5353 blocktime TXT +short```

**Response format:**
```
"SOLANA NETWORK BLOCK TIME SUMMARY FOR LAST 1 HOUR"
"---------------------------------"
"CURRENT BLOCKTIME: 408.16ms"
"AVERAGE BLOCKTIME: 392 ms"
"MAXIMUM BLOCKTIME: 408.16 ms"
"MINIMUM BLOCKTIME: 382.17ms"
"TIME AGO     | VALUE"
"-------------|----------"
"11 mins ago  | 397.35 ms"
"10 mins ago  | 389.61 ms"
"9 mins ago   | 394.74 ms"
"8 mins ago   | 394.74 ms"
"7 mins ago   | 384.62 ms"
"6 mins ago   | 384.62 ms"
"5 mins ago   | 382.17 ms"
"4 mins ago   | 394.74 ms"
"3 mins ago   | 394.74 ms"
"2 mins ago   | 408.16 ms"
```

### `top-validators`
Lists information about top 10 validators.

**Example:**
```dig @3.82.20.22 -p 5353 top-validators TXT +short```

**Response format:**
```
"TOP 10 SOLANA VALIDATORS"
"------------------------"
"1. Helius - 13.98M SOL - 0% commission - 20,395 delegators"
"2. binance staking - 12.47M SOL - 8% commission - 544 delegators"
"3. Galaxy - 9.80M SOL - 5% commission - 981 delegators"
"4. Coinbase 02 - 8.84M SOL - 8% commission - 1,533 delegators"
"5. Ledger by Figment - 8.77M SOL - 7% commission - 115,497 delegators"
"6. Figment - 7.32M SOL - 7% commission - 9,857 delegators"
"7. Kiln1 - 6.61M SOL - 5% commission - 3,739 delegators"
"8. Everstake - 5.86M SOL - 7% commission - 189,156 delegators"
"9. SOL Community - 5.84M SOL - 5% commission - 906 delegators"
"10. Unknown - 5.47M SOL - 100% commission - 20 delegators"
```

### `price-chart`
Displays live SOL price and 24 hour price chart.

**Example:**
```dig @3.82.20.22 -p 5353 price-chart TXT +short```

**Response format:**
```
"SOL Price: $168.90(-2.52% v) (as of 05/17 04:58)"
"Market Cap - $71.8B"
"24H Volume - $3.6B"
"$173.78 +--------------------------------------------------+"
"        | **         ** *****                             |"
"        |  ****   **  *      *   *                       |"
"        |        *          * ***     *                  |"
"        |      **                 **** *                 |"
"        |                               ***              |"
"$169.43 |                                    *        ***|"
"        |                                  ** **         |"
"        |                                       *   *    |"
"        |                                        * * *   |"
"$165.08 |                                         *      |"
"       +--------------------------------------------------+"
"         05/16 05:28     05/16 17:28     05/17 04:58"
```

### `sol-supply`
Shows Solana supply statistics.

**Example:**
```dig @3.82.20.22 -p 5353 sol-supply TXT +short```

**Response format:**
```
"SOLANA SUPPLY & STAKE DATA"
"---------------------"
"Circulating SOL Supply: 519.8M SOL  - [###################################-----] 86.5%"
"Active Staked SOL: 392.9M SOL       - [##########################--------------] 65.4%"
"Total SOL Supply: 600.9M SOL"
"---------------------"
"Current Epoch: 788"
"Staking APY: 7.07%"
"Inflation Rate: 4.58%"
"---------------------"
```

### `stake-data`
Provides SOL Staking statistics overview.

**Example:**
```dig @3.82.20.22 -p 5353 stake-data TXT +short```

**Response format:**
```
"SOLANA NETWORK STAKING STATISTICS"
"---------------------------------"
"TOTAL STAKED: 398.42M SOL ($70.33B)"
"ACTIVE STAKERS: 1,021,443"
"UNIQUE WALLETS: 508,796"
"BIGGEST STAKE: 8.39M SOL ($1.48B)"
"MEDIAN STAKE: 1.14 SOL ($200.53)"
"MEAN STAKE: 386.18 SOL ($68.17K)"
"FILTER APY: 6.82%"
"UPDATED: 5 minutes ago"
```

### `stake-graph`
Displays a staked SOL chart distribution over epochs.

**Example:**
```dig @3.82.20.22 -p 5353 stake-graph TXT +short```

**Response format:**
```
"SOLANA STAKE GROWTH OVER TIME (EPOCHS VS BALANCE)"
""
"Epoch 172 - 318.46M SOL: ----------------------- "
"Epoch 221 - 387.84M SOL: ------------------------------ "
"Epoch 270 - 402.16M SOL: -------------------------------- "
"Epoch 320 - 382.32M SOL: ------------------------------ "
"Epoch 372 - 374.69M SOL: ----------------------------- "
"Epoch 424 - 383.68M SOL: ------------------------------ "
"Epoch 475 - 389.16M SOL: ------------------------------ "
"Epoch 536 - 318.55M SOL: ----------------------- "
"Epoch 585 - 375.39M SOL: ----------------------------- "
"Epoch 635 - 379.47M SOL: ----------------------------- "
"Epoch 684 - 393.77M SOL: ------------------------------- "
"Epoch 733 - 389.58M SOL: ------------------------------ "
"Epoch 788 - 395.96M SOL: ------------------------------- "
""
" Stake SOL Range: MIN 80.99M SOL - MAX 411.23M SOL"
```

### `stake-average-size`
Shows average staked SOL size statistics.

**Example:**
```dig @3.82.20.22 -p 5353 stake-average-size TXT +short```

**Response format:**
```
" AVERAGE SOL STAKED SIZES"
"SOL RANGE         | TOTAL SOL STAKED      | NUM STAKES | WALLETS   | VALIDATORS"
"------------------|-------------------|------------|-----------|----------"
"     0 - 5        | 674.25K (0.17%) |    696,634 |   391,049 |      3,347"
"     5 - 10       | 546.90K (0.14%) |     79,318 |    49,486 |      1,048"
"    10 - 50       | 2.98M (0.75%) |    135,638 |    75,660 |      1,409"
"    50 - 100      | 2.39M (0.60%) |     35,068 |    22,416 |      1,214"
"   100 - 500      | 12.59M (3.16%) |     53,525 |    26,001 |      1,730"
"   500 - 1000     | 4.89M (1.23%) |      7,266 |     4,632 |        531"
"  1000 - 5000     | 16.91M (4.24%) |      8,449 |     4,284 |        863"
"  5000 - 10000    | 10.52M (2.64%) |      1,546 |       846 |        403"
" 10000 - 50000    | 50.83M (12.76%) |      2,367 |       947 |        877"
" 50000 - 100000   | 49.60M (12.45%) |        666 |       232 |        405"
"100000 - 250000   | 89.53M (22.47%) |        708 |       184 |        302"
"250000 - 500000   | 53.44M (13.41%) |        145 |       137 |         56"
"500000 - 99999999 | 103.44M (25.96%) |         77 |        63 |         53"
""
"Last updated: 5/17/2025, 10:48:19 AM"
```

### `help`
Lists all available DNS commands.

**Example:**
```dig @3.82.20.22 -p 5353 help TXT +short ```

**Response format:**
```
"This is a DNS server that takes creative liberties with the DNS protocol to offer handy Solana utilities that are easily accessible via CLI without having to open a clunky search page. Copy and run the below commands to try it out"
"AVAILABLE DNS COMMANDS:"
"-------------------"
"dig @3.82.20.22 -p 5353 epoch TXT +short               - Show current epoch progress"
"dig @3.82.20.22 -p 5353 tps TXT +short                 - Show Transactions per second(TPS) records"
"dig @3.82.20.22 -p 5353 blocktime TXT +short           - Show blocktime metrics records"
"dig @3.82.20.22 -p 5353 top-validators TXT +short      - Show top 10 Solana validators"
"dig @3.82.20.22 -p 5353 price-chart TXT +short         - Show Solana price chart and metrics"
"dig @3.82.20.22 -p 5353 sol-supply TXT +short          - Show Total Solana Supply and Stake Data"
"dig @3.82.20.22 -p 5353 stake-data TXT +short          - Get Solana staking statistics"
"dig @3.82.20.22 -p 5353 stake-graph TXT +short         - Get Solana staking graph"
"dig @3.82.20.22 -p 5353 stake-average-size TXT +short  - Get Solana average stake sizes"
"dig @3.82.20.22 -p 5353 help TXT +short                - Show all commands list"
```


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
