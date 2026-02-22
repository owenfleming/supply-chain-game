# supply-chain-game
a simple supply chain game to get experience with supply chain concepts, vibe coding, and git

## About

Supply Chain Tycoon is a single-page interactive browser game that teaches Supply Chain 101 concepts through hands-on gameplay. You manage a company that must source raw materials, manufacture products, manage inventory, and fulfill customer demand across 30 rounds.

Built with React, Tailwind CSS, Recharts, and Lucide icons.

## How to Run

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open `http://localhost:5173` in your browser.

## How to Play

Each round represents one week of operations. Every round you:

1. **Review demand** -- See how many units customers want this round, along with a forecast and trend indicator.
2. **Order from suppliers** -- Choose a supplier and enter the quantity to order. Orders take time to arrive (lead time).
3. **Fulfill orders** -- Ship units from your warehouse inventory to customers. Choose a shipping method (Ground, Express, or Air).
4. **End the round** -- Costs are calculated, revenue is earned, and you see a summary of what happened.

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
| Logistics & Transportation | Round 21 | Speed vs. cost trade-offs in shipping |
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
| Ground shipping | $1/unit (2 rounds) |
| Express shipping | $3/unit (1 round) |
| Air freight | $5/unit (same round) |

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
