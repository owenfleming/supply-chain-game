# supply-chain-game
a simple supply chain game to get experience with supply chain concepts, vibe coding, and git

## About

Supply Chain Tycoon is a single-page interactive browser game that teaches Supply Chain 101 concepts through hands-on gameplay. You manage a company that must source raw materials, manufacture products, manage inventory, and fulfill customer demand across 30 rounds.

Built with React, Tailwind CSS, Recharts, and Lucide icons.

## How to Run

### Prerequisites

You need **Node.js** installed on your computer. Node.js is a free tool that lets you run JavaScript applications.

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** (Long Term Support) version -- this is the big green button on the homepage
3. Run the installer and accept all the default settings
4. To verify it installed correctly, open a terminal and type:
   ```bash
   node --version
   ```
   You should see a version number like `v20.x.x` or `v24.x.x`. If you see an error, try restarting your terminal or computer.

> **How to open a terminal:**
> - **Windows:** Press `Win + R`, type `cmd`, and press Enter. Or search for "Command Prompt" or "PowerShell" in the Start menu.
> - **Mac:** Press `Cmd + Space`, type "Terminal", and press Enter.
> - **Linux:** Press `Ctrl + Alt + T`.

### Setup and Start

1. **Download this project** -- Click the green **Code** button at the top of this GitHub page, then click **Download ZIP**. Unzip the folder somewhere on your computer. (Or if you know git: `git clone https://github.com/owenfleming/supply-chain-game.git`)

2. **Open a terminal in the project folder** -- Navigate to the unzipped folder:
   ```bash
   cd path/to/supply-chain-game
   ```
   For example, if you unzipped it to your Downloads folder:
   ```bash
   cd ~/Downloads/supply-chain-game-main
   ```

3. **Install dependencies** -- This downloads all the libraries the game needs (only required once):
   ```bash
   npm install
   ```
   This may take a minute or two. You'll see a progress bar and then a success message.

4. **Start the game:**
   ```bash
   npm run dev
   ```
   You should see output that includes a URL like:
   ```
   Local: http://localhost:5173/
   ```

5. **Open the game** -- Open your web browser (Chrome, Firefox, Edge, etc.) and go to:
   ```
   http://localhost:5173
   ```
   The game should load and you'll see the title screen.

6. **To stop the game** -- Go back to your terminal and press `Ctrl + C`.

### Troubleshooting

- **"npm: command not found"** -- Node.js isn't installed or your terminal needs to be restarted. Go back to the Prerequisites step.
- **"EACCES permission denied"** -- On Mac/Linux, try prefixing the command with `sudo`: `sudo npm install`
- **Page is blank** -- Check the terminal for error messages. Try stopping the server (`Ctrl + C`) and running `npm run dev` again.
- **Port already in use** -- Another application is using port 5173. Stop that application or run `npx vite --port 3000` and open `http://localhost:3000` instead.

## How to Play

Each round represents one week of operations. Every round you:

1. **Review demand** -- See how many units customers want this round, along with a forecast and trend indicator.
2. **Order from suppliers** -- Choose a supplier and enter the quantity to order. Orders take time to arrive (lead time).
3. **Fulfill orders** -- Ship units from your warehouse inventory to customers. Choose a shipping method (Ground, Express, or Air). Cheaper methods have a higher chance of late delivery penalties.
4. **End the round** -- Costs are calculated, revenue is earned, and you see a summary of what happened.

> **Tip:** Look for the **?** icons next to each panel header for help tooltips explaining what each section does and how to make decisions.

### Goal

Survive all 30 rounds with a positive cash balance and customer satisfaction at or above 75%.

- **Starting cash:** $50,000
- **Revenue:** $15 per unit sold
- **Lose condition:** Go bankrupt ($0 cash) or customer satisfaction drops below 30%

## Game Structure

### Level 1: The Basics (Rounds 1-5)
Simple steady demand, one supplier, one product. Learn ordering, lead time, and inventory holding costs.

### Level 2: Scaling Up (Rounds 6-12)
Demand becomes variable. A second supplier unlocks. Introduces forecasting, safety stock, and demand trends.

### Level 3: Complexity (Rounds 13-20)
A third overseas supplier and air freight unlock. Warehouse capacity matters. The bullwhip effect chart appears showing how your orders compare to actual demand.

### Level 4: Chaos (Rounds 21-30)
Supply disruptions hit -- port strikes, factory fires, viral demand surges, and quality recalls. Adapt or go bankrupt.

## Concepts Taught

The game progressively introduces 10 supply chain concepts with tutorial popups:

| Concept | Introduced | Description |
|---------|-----------|-------------|
| Demand Forecasting | Round 1 | Predicting future customer demand from historical data |
| Procurement & Sourcing | Round 1 | Choosing suppliers based on cost, speed, reliability, quality |
| Lead Time | Round 6 | The delay between placing an order and receiving it |
| Inventory Management | Round 6 | Balancing holding costs against stockout risk |
| Safety Stock | Round 8 | Buffer inventory to protect against uncertainty |
| Bullwhip Effect | Round 13 | How small demand changes amplify upstream in the supply chain |
| Order Fulfillment | Round 15 | Measuring fill rate and on-time delivery |
| Total Cost of Ownership | Round 17 | Why the cheapest supplier isn't always the best choice |
| Logistics & Transportation | Round 21 | Cost vs. late delivery risk trade-offs in shipping |
| Supply Disruptions | Round 22 | Dealing with unexpected events that break the supply chain |

## Suppliers

| Supplier | Cost | Lead Time | Reliability | Quality | Unlocked |
|----------|------|-----------|-------------|---------|----------|
| QuickSource Inc. | $8/unit | 1 round | 95% | 98% | Level 1 |
| BudgetParts Co. | $5/unit | 3 rounds | 80% | 90% | Level 2 |
| GlobalTrade Ltd. | $6/unit | 2 rounds | 90% | 95% | Level 3 |

## Cost Structure

| Item | Cost |
|------|------|
| Holding cost | $0.50 per unit per round |
| Stockout penalty | $3.00 per unfulfilled unit |
| Late delivery penalty | $1.50 per unit |
| Ground shipping | $1/unit (25% late delivery risk) |
| Express shipping | $3/unit (8% late delivery risk) |
| Air freight | $5/unit (no late delivery risk) |

## End of Game

After round 30, you get:
- A **summary dashboard** with total revenue, cost breakdown, cash timeline, and bullwhip effect analysis
- A **concepts review** showing which supply chain topics you encountered
- A **5-question quiz** testing what you learned
- A **final letter grade** (A through F) based on financial performance (40%), customer satisfaction (40%), and quiz score (20%)

## Tech Stack

- React (Vite)
- Tailwind CSS v4
- Recharts
- Lucide React
