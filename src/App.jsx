import { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';
import {
  Package, Truck, Factory, TrendingUp, DollarSign, AlertTriangle,
  ShoppingCart, Warehouse, ArrowRight, CheckCircle, XCircle, Info,
  Star, Award, ChevronRight, Play, RotateCcw, Zap, Shield, Clock,
  BarChart3, Target, Box, Ship, Plane, MapPin, X, HelpCircle
} from 'lucide-react';

// ─── CONSTANTS ──────────────────────────────────────────────

const STARTING_CASH = 50000;
const REVENUE_PER_UNIT = 15;
const HOLDING_COST = 0.5;
const STOCKOUT_PENALTY = 3.0;
const LATE_PENALTY = 1.5;
const TOTAL_ROUNDS = 30;
const INITIAL_WAREHOUSE_CAPACITY = 500;

const LEVELS = [
  { name: 'The Basics', rounds: [1, 5], concepts: ['demand_forecasting', 'procurement'] },
  { name: 'Scaling Up', rounds: [6, 12], concepts: ['lead_time', 'inventory_management', 'safety_stock'] },
  { name: 'Complexity', rounds: [13, 20], concepts: ['bullwhip', 'fulfillment', 'tco'] },
  { name: 'Chaos', rounds: [21, 30], concepts: ['logistics', 'disruptions'] },
];

const SUPPLIERS = [
  { id: 'A', name: 'QuickSource Inc.', cost: 8, leadTime: 1, reliability: 0.95, quality: 0.98, location: 'Domestic', unlockLevel: 0 },
  { id: 'B', name: 'BudgetParts Co.', cost: 5, leadTime: 3, reliability: 0.80, quality: 0.90, location: 'Domestic', unlockLevel: 1 },
  { id: 'C', name: 'GlobalTrade Ltd.', cost: 6, leadTime: 2, reliability: 0.90, quality: 0.95, location: 'Overseas', unlockLevel: 2 },
];

const SHIPPING_METHODS = [
  { id: 'ground', name: 'Ground', icon: 'Truck', cost: 1, speed: 2, latePenaltyPct: 0.25, unlockLevel: 0, desc: 'Cheapest option but slowest delivery. 25% of units risk late delivery penalties.' },
  { id: 'express', name: 'Express', icon: 'Truck', cost: 3, speed: 1, latePenaltyPct: 0.08, unlockLevel: 0, desc: 'Balanced speed and cost. Only 8% of units risk late delivery penalties.' },
  { id: 'air', name: 'Air Freight', icon: 'Plane', cost: 5, speed: 0, latePenaltyPct: 0, unlockLevel: 2, desc: 'Most expensive but fastest. No risk of late delivery penalties.' },
];

const CONCEPTS = {
  demand_forecasting: {
    title: 'Demand Forecasting',
    explanation: 'Demand forecasting is the process of predicting how many units customers will want to buy. Companies use historical sales data, trends, and patterns to estimate future demand.',
    realWorld: 'Amazon uses machine learning to forecast demand for millions of products, positioning inventory in warehouses close to where they predict orders will come from.',
    trigger: 1,
  },
  procurement: {
    title: 'Procurement & Sourcing',
    explanation: 'Procurement means choosing where to buy your materials. Different suppliers offer different trade-offs in cost, speed, reliability, and quality. Smart sourcing is about finding the right balance.',
    realWorld: 'Apple sources components from over 200 suppliers worldwide, carefully balancing cost efficiency with quality standards and delivery reliability.',
    trigger: 1,
  },
  lead_time: {
    title: 'Lead Time',
    explanation: 'Lead time is the delay between placing an order and receiving it. Longer lead times mean you need to plan further ahead and may need more safety stock to cover the gap.',
    realWorld: 'During COVID-19, semiconductor lead times stretched from weeks to over a year, causing massive disruptions across automotive and electronics industries.',
    trigger: 6,
  },
  inventory_management: {
    title: 'Inventory Management',
    explanation: 'Holding inventory costs money (storage, insurance, obsolescence), but having too little means you can\'t fulfill orders. The goal is finding the right balance between carrying costs and service levels.',
    realWorld: 'Toyota pioneered "Just-in-Time" inventory, keeping minimal stock and receiving parts only as needed — dramatically reducing waste and costs.',
    trigger: 6,
  },
  safety_stock: {
    title: 'Safety Stock',
    explanation: 'Safety stock is extra inventory kept as a buffer against uncertainty — unexpected demand spikes or supply delays. It\'s like an insurance policy for your supply chain.',
    realWorld: 'Hospitals maintain safety stock of critical medications and PPE to handle unexpected surges in patient volume.',
    trigger: 8,
  },
  bullwhip: {
    title: 'The Bullwhip Effect',
    explanation: 'When small changes in customer demand cause increasingly larger swings in orders placed upstream in the supply chain. Overreacting to demand changes amplifies volatility.',
    realWorld: 'During the 2020 toilet paper shortage, a modest 40% spike in consumer buying led to 800%+ order increases at the manufacturer level — a textbook bullwhip effect.',
    trigger: 13,
  },
  fulfillment: {
    title: 'Order Fulfillment & Service Level',
    explanation: 'Your fill rate measures what percentage of customer orders you successfully fulfill on time. High fill rates mean happy customers; low fill rates mean lost sales and damaged reputation.',
    realWorld: 'Walmart targets a 98.5% in-stock rate across its stores, using sophisticated logistics to keep shelves full.',
    trigger: 15,
  },
  tco: {
    title: 'Total Cost of Ownership',
    explanation: 'The cheapest unit price isn\'t always the best deal. Total cost includes defect rates, late deliveries, expediting fees, and quality problems that add hidden costs.',
    realWorld: 'A car manufacturer might pay 20% more for a reliable local supplier versus a cheap overseas one, because defective parts can halt an entire assembly line.',
    trigger: 17,
  },
  logistics: {
    title: 'Logistics & Transportation',
    explanation: 'Choosing how to ship goods involves trade-offs between speed and cost. Air freight is fast but expensive; sea freight is cheap but slow. The right choice depends on urgency and margins.',
    realWorld: 'Zara uses air freight for fast-fashion items to get trends to stores in 2 weeks, while competitors using sea freight take 2-3 months.',
    trigger: 21,
  },
  disruptions: {
    title: 'Supply Disruptions',
    explanation: 'Unexpected events — natural disasters, strikes, pandemics — can break supply chains. Resilient companies diversify suppliers, maintain safety stock, and have contingency plans.',
    realWorld: 'The 2021 Suez Canal blockage by the Ever Given container ship disrupted $9 billion in daily trade and caused global ripple effects for months.',
    trigger: 22,
  },
};

const DISRUPTION_EVENTS = [
  {
    id: 'port_strike',
    title: 'Port Strike!',
    description: 'Dock workers at the international port have gone on strike. Overseas supplier lead times increase by 2 rounds for the next 3 rounds.',
    icon: 'Ship',
    effect: 'overseas_delay',
    duration: 3,
    extraLeadTime: 2,
  },
  {
    id: 'factory_fire',
    title: 'Supplier Factory Fire!',
    description: 'A fire has broken out at one of your supplier\'s facilities. They will be unavailable for the next 2 rounds.',
    icon: 'Factory',
    effect: 'supplier_down',
    duration: 2,
    targetSupplier: null,
  },
  {
    id: 'demand_surge',
    title: 'Viral Demand Surge!',
    description: 'Your product went viral on social media! Customer demand will double for the next 2 rounds.',
    icon: 'TrendingUp',
    effect: 'demand_multiplier',
    duration: 2,
    multiplier: 2,
  },
  {
    id: 'quality_recall',
    title: 'Quality Recall!',
    description: 'A quality defect has been discovered. 30% of your current inventory must be discarded immediately.',
    icon: 'AlertTriangle',
    effect: 'inventory_loss',
    lossPct: 0.3,
  },
];

const QUIZ_QUESTIONS = [
  {
    question: 'What is the bullwhip effect?',
    options: [
      'When customer demand amplifies as it moves upstream in the supply chain',
      'When inventory costs decrease over time',
      'When suppliers offer bulk discounts',
      'When shipping speeds improve with volume',
    ],
    correct: 0,
    concept: 'bullwhip',
  },
  {
    question: 'Why might a more expensive supplier be the better choice?',
    options: [
      'Expensive suppliers always have better marketing',
      'Higher reliability and quality can reduce total cost of ownership',
      'Price is the only factor that matters in procurement',
      'Expensive suppliers never have defects',
    ],
    correct: 1,
    concept: 'tco',
  },
  {
    question: 'What is safety stock?',
    options: [
      'Stock that has passed safety inspections',
      'The minimum inventory needed to operate',
      'Extra buffer inventory to protect against demand uncertainty and supply variability',
      'Inventory stored in a secure warehouse',
    ],
    correct: 2,
    concept: 'safety_stock',
  },
  {
    question: 'What happens when lead time increases?',
    options: [
      'You need to plan orders further in advance',
      'Products become cheaper',
      'Customer demand decreases',
      'Warehouse capacity increases',
    ],
    correct: 0,
    concept: 'lead_time',
  },
  {
    question: 'What does a "fill rate" measure?',
    options: [
      'How full your warehouse is',
      'The percentage of customer orders fulfilled on time',
      'How quickly suppliers respond to orders',
      'The rate at which demand increases',
    ],
    correct: 1,
    concept: 'fulfillment',
  },
];

// ─── UTILITY FUNCTIONS ────────────────────────────────────

function getLevel(round) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (round >= LEVELS[i].rounds[0] && round <= LEVELS[i].rounds[1]) return i;
  }
  return 3;
}

function getLevelInfo(round) {
  const idx = getLevel(round);
  return { ...LEVELS[idx], index: idx };
}

function generateDemand(round, level) {
  const base = 100;
  let demand;
  if (level === 0) {
    demand = base + Math.round((Math.random() - 0.5) * 20);
  } else if (level === 1) {
    const trend = (round - 6) * 3;
    const seasonal = Math.sin((round / 12) * Math.PI * 2) * 15;
    const noise = (Math.random() - 0.5) * 30;
    demand = Math.round(base + trend + seasonal + noise);
  } else {
    const trend = (round - 6) * 3;
    const seasonal = Math.sin((round / 12) * Math.PI * 2) * 20;
    const noise = (Math.random() - 0.5) * 40;
    const shock = Math.random() < 0.15 ? (Math.random() > 0.5 ? 40 : -30) : 0;
    demand = Math.round(base + trend + seasonal + noise + shock);
  }
  return Math.max(20, demand);
}

function generateForecast(actualDemand, round) {
  const error = (Math.random() - 0.3) * 0.2;
  const forecast = Math.round(actualDemand * (1 + error));
  return Math.max(10, forecast);
}

function getDemandTrend(history) {
  if (history.length < 3) return 'Stable';
  const recent = history.slice(-3);
  const avg1 = recent[0];
  const avg2 = recent[recent.length - 1];
  const diff = avg2 - avg1;
  if (diff > 10) return 'Rising';
  if (diff < -10) return 'Falling';
  return 'Stable';
}

function formatCurrency(amount) {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── INITIAL STATE ────────────────────────────────────────

function createInitialState() {
  const firstDemand = generateDemand(1, 0);
  return {
    phase: 'title',
    round: 1,
    cash: STARTING_CASH,
    inventory: 150,
    warehouseCapacity: INITIAL_WAREHOUSE_CAPACITY,
    satisfaction: 100,
    demandHistory: [],
    orderHistory: [],
    cashHistory: [{ round: 0, cash: STARTING_CASH }],
    satisfactionHistory: [],
    currentDemand: firstDemand,
    forecast: generateForecast(firstDemand, 1),
    pendingOrders: [],
    inTransitShipments: [],
    activeEvents: [],
    shownConcepts: [],
    pendingConcept: null,
    roundSummary: null,
    financials: {
      totalRevenue: 0,
      totalProcurement: 0,
      totalHolding: 0,
      totalShipping: 0,
      totalPenalties: 0,
      roundRevenue: 0,
      roundProcurement: 0,
      roundHolding: 0,
      roundShipping: 0,
      roundPenalties: 0,
    },
    totalFulfilled: 0,
    totalDemanded: 0,
    selectedShipping: 'ground',
    fulfillQty: 0,
    supplierOrders: {},
    gameOver: false,
    gameWon: false,
    quizAnswers: [],
    quizPhase: false,
    showEndSummary: false,
    disabledSuppliers: [],
    demandMultiplier: 1,
    eventLog: [],
    tips: [],
  };
}

// ─── GAME REDUCER ──────────────────────────────────────

function getDemandMultiplierFromEvents(events) {
  const surgeEvent = events.find(e => e.effect === 'demand_multiplier' && e.remainingRounds > 0);
  return surgeEvent ? surgeEvent.multiplier : 1;
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return { ...createInitialState(), phase: 'concept', pendingConcept: 'demand_forecasting' };

    case 'SET_SUPPLIER_ORDER': {
      return {
        ...state,
        supplierOrders: { ...state.supplierOrders, [action.supplierId]: action.qty },
      };
    }

    case 'SET_SHIPPING': {
      return { ...state, selectedShipping: action.method };
    }

    case 'SET_FULFILL_QTY': {
      return { ...state, fulfillQty: action.qty };
    }

    case 'SHOW_CONCEPT': {
      return { ...state, pendingConcept: action.concept };
    }

    case 'DISMISS_CONCEPT': {
      const newShown = [...state.shownConcepts, state.pendingConcept];
      // Check for another concept with the same trigger round
      const conceptKeys = Object.keys(CONCEPTS);
      let nextConcept = null;
      for (const key of conceptKeys) {
        if (CONCEPTS[key].trigger === state.round && !newShown.includes(key)) {
          nextConcept = key;
          break;
        }
      }
      return {
        ...state,
        pendingConcept: nextConcept,
        shownConcepts: newShown,
        phase: nextConcept ? 'concept' : 'playing',
      };
    }

    case 'PROCESS_ROUND': {
      let s = { ...state };
      const level = getLevel(s.round);
      let tips = [];
      let roundRevenue = 0;
      let roundProcurement = 0;
      let roundShipping = 0;
      let roundHolding = 0;
      let roundPenalties = 0;

      // 1. Receive incoming shipments
      let newInTransit = [];
      for (let shipment of s.inTransitShipments) {
        if (shipment.arrivedRound <= s.round) {
          const supplier = SUPPLIERS.find(sp => sp.id === shipment.supplierId);
          const reliable = Math.random() < supplier.reliability;
          if (reliable) {
            const usable = Math.floor(shipment.qty * supplier.quality);
            const defective = shipment.qty - usable;
            s.inventory = Math.min(s.inventory + usable, s.warehouseCapacity);
            if (defective > 0) {
              tips.push(`${defective} units from ${supplier.name} were defective and discarded.`);
            }
          } else {
            newInTransit.push({ ...shipment, arrivedRound: shipment.arrivedRound + 1 });
            tips.push(`Shipment from ${supplier.name} delayed! ${shipment.qty} units arriving next round.`);
          }
        } else {
          newInTransit.push(shipment);
        }
      }
      s.inTransitShipments = newInTransit;

      // 2. Apply active disruption events
      let activeEvents = [];
      for (let evt of s.activeEvents) {
        if (evt.remainingRounds > 0) {
          activeEvents.push({ ...evt, remainingRounds: evt.remainingRounds - 1 });
        }
      }
      s.activeEvents = activeEvents;

      // 3. Place supplier orders
      let totalOrderedThisRound = 0;
      Object.entries(s.supplierOrders).forEach(([supplierId, qty]) => {
        if (qty > 0) {
          const supplier = SUPPLIERS.find(sp => sp.id === supplierId);
          if (s.disabledSuppliers.includes(supplierId)) {
            tips.push(`Cannot order from ${supplier.name} — currently unavailable due to disruption.`);
            return;
          }
          const cost = qty * supplier.cost;
          if (cost > s.cash) {
            tips.push(`Cannot afford order from ${supplier.name}. Need ${formatCurrency(cost)}, have ${formatCurrency(Math.floor(s.cash))}.`);
            return;
          }
          let leadTime = supplier.leadTime;
          if (supplier.location === 'Overseas') {
            const overseasDelay = s.activeEvents.find(e => e.effect === 'overseas_delay');
            if (overseasDelay) {
              leadTime += overseasDelay.extraLeadTime;
            }
          }
          s.cash -= cost;
          roundProcurement += cost;
          totalOrderedThisRound += qty;
          s.inTransitShipments = [...s.inTransitShipments, {
            supplierId,
            qty,
            orderedRound: s.round,
            arrivedRound: s.round + leadTime,
          }];
        }
      });

      // 4. Fulfill customer orders
      const actualDemand = Math.round(s.currentDemand * s.demandMultiplier);
      const fulfillQty = Math.min(s.fulfillQty, s.inventory, actualDemand);
      const unfulfilled = actualDemand - fulfillQty;

      const shippingMethod = SHIPPING_METHODS.find(m => m.id === s.selectedShipping);
      const shippingCost = fulfillQty * shippingMethod.cost;
      roundShipping += shippingCost;
      s.cash -= shippingCost;

      const revenue = fulfillQty * REVENUE_PER_UNIT;
      roundRevenue += revenue;
      s.cash += revenue;

      // Late delivery penalties based on shipping speed
      const lateUnits = Math.floor(fulfillQty * shippingMethod.latePenaltyPct);
      if (lateUnits > 0) {
        const latePenalty = lateUnits * LATE_PENALTY;
        roundPenalties += latePenalty;
        s.cash -= latePenalty;
        tips.push(`${lateUnits} units arrived late to customers via ${shippingMethod.name} shipping, costing ${formatCurrency(latePenalty)} in late delivery penalties.`);
      }

      if (unfulfilled > 0) {
        const penalty = unfulfilled * STOCKOUT_PENALTY;
        roundPenalties += penalty;
        s.cash -= penalty;
        tips.push(`${unfulfilled} orders went unfulfilled, costing ${formatCurrency(penalty)} in stockout penalties.`);
      }

      s.inventory -= fulfillQty;

      // 5. Holding costs
      const holdingCost = s.inventory * HOLDING_COST;
      roundHolding += holdingCost;
      s.cash -= holdingCost;

      // 6. Update stats
      s.totalFulfilled += fulfillQty;
      s.totalDemanded += actualDemand;

      const fillRate = actualDemand > 0 ? (fulfillQty / actualDemand) * 100 : 100;
      const satChange = fillRate >= 90 ? 2 : fillRate >= 70 ? 0 : fillRate >= 50 ? -5 : -10;
      s.satisfaction = Math.max(0, Math.min(100, s.satisfaction + satChange));

      // 7. Update histories
      s.demandHistory = [...s.demandHistory, actualDemand];
      s.orderHistory = [...s.orderHistory, totalOrderedThisRound];
      s.cashHistory = [...s.cashHistory, { round: s.round, cash: Math.floor(s.cash) }];
      s.satisfactionHistory = [...s.satisfactionHistory, { round: s.round, satisfaction: Math.round(s.satisfaction) }];

      // 8. Update financials
      const netProfit = roundRevenue - roundProcurement - roundShipping - roundHolding - roundPenalties;
      s.financials = {
        totalRevenue: s.financials.totalRevenue + roundRevenue,
        totalProcurement: s.financials.totalProcurement + roundProcurement,
        totalHolding: s.financials.totalHolding + roundHolding,
        totalShipping: s.financials.totalShipping + roundShipping,
        totalPenalties: s.financials.totalPenalties + roundPenalties,
        roundRevenue,
        roundProcurement,
        roundHolding,
        roundShipping,
        roundPenalties,
      };

      // 9. Safety stock tip
      if (s.inventory === 0 && level >= 1) {
        tips.push('Your inventory hit zero! Consider keeping safety stock — extra buffer inventory to protect against unexpected demand.');
      }

      // 10. Bullwhip tip
      if (level >= 2 && s.orderHistory.length >= 5) {
        const recentOrders = s.orderHistory.slice(-5);
        const recentDemand = s.demandHistory.slice(-5);
        const orderVariance = Math.max(...recentOrders) - Math.min(...recentOrders);
        const demandVariance = Math.max(...recentDemand) - Math.min(...recentDemand);
        if (orderVariance > demandVariance * 1.5 && !tips.some(t => t.includes('bullwhip'))) {
          tips.push('Your order quantities are swinging more than customer demand — the bullwhip effect in action! Try to smooth your ordering.');
        }
      }

      // 11. Round summary
      s.roundSummary = {
        round: s.round,
        demand: actualDemand,
        fulfilled: fulfillQty,
        unfulfilled,
        lateUnits,
        revenue: roundRevenue,
        costs: roundProcurement + roundShipping + roundHolding + roundPenalties,
        profit: netProfit,
        fillRate: Math.round(fillRate),
      };

      s.tips = tips;

      // 12. Check game over
      if (s.cash <= 0) {
        return { ...s, gameOver: true, gameWon: false, phase: 'gameover', supplierOrders: {}, fulfillQty: 0, demandMultiplier: 1 };
      }
      if (s.satisfaction <= 30) {
        return { ...s, gameOver: true, gameWon: false, phase: 'gameover', supplierOrders: {}, fulfillQty: 0, demandMultiplier: 1 };
      }

      return { ...s, phase: 'round_summary', supplierOrders: {}, fulfillQty: 0, demandMultiplier: getDemandMultiplierFromEvents(s.activeEvents) };
    }

    case 'NEXT_ROUND': {
      let s = { ...state };
      if (s.round >= TOTAL_ROUNDS) {
        return { ...s, phase: 'end_summary', gameWon: s.satisfaction >= 75 && s.cash > 0 };
      }

      const nextRound = s.round + 1;
      const level = getLevel(nextRound);

      // Check for new disruption events in Level 4
      let newEvents = [...s.activeEvents];
      let disabledSuppliers = [...s.disabledSuppliers];
      let eventLog = [...s.eventLog];
      let inventoryLoss = 0;

      if (level === 3) {
        const eventRounds = [22, 25, 27, 29];
        if (eventRounds.includes(nextRound) || (nextRound >= 22 && Math.random() < 0.15)) {
          const availableEvents = DISRUPTION_EVENTS.filter(e =>
            !eventLog.some(log => log.id === e.id && log.round > nextRound - 4)
          );
          if (availableEvents.length > 0) {
            const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            let appliedEvent = { ...event, round: nextRound };

            if (event.effect === 'supplier_down') {
              const availableSuppliers = SUPPLIERS.filter(sp => sp.unlockLevel <= level && !disabledSuppliers.includes(sp.id));
              if (availableSuppliers.length > 0) {
                const target = availableSuppliers[Math.floor(Math.random() * availableSuppliers.length)];
                appliedEvent.targetSupplier = target.id;
                appliedEvent.description = `A fire has broken out at ${target.name}'s facility. They will be unavailable for the next ${event.duration} rounds.`;
                disabledSuppliers.push(target.id);
              }
            }

            if (event.effect === 'inventory_loss') {
              inventoryLoss = Math.floor(s.inventory * event.lossPct);
            }

            if (event.duration) {
              newEvents.push({ ...appliedEvent, remainingRounds: event.duration });
            }
            eventLog.push(appliedEvent);

            const newDemand = generateDemand(nextRound, level);
            const demandMult = getDemandMultiplierFromEvents(newEvents);

            return {
              ...s,
              round: nextRound,
              phase: 'event',
              currentDemand: newDemand,
              forecast: generateForecast(Math.round(newDemand * demandMult), nextRound),
              activeEvents: newEvents,
              disabledSuppliers,
              eventLog,
              inventory: s.inventory - inventoryLoss,
              pendingEventInfo: appliedEvent,
              demandMultiplier: demandMult,
              roundSummary: null,
              tips: [],
            };
          }
        }
      }

      // Clean up disabled suppliers whose events expired
      disabledSuppliers = disabledSuppliers.filter(sId => {
        return newEvents.some(e => e.effect === 'supplier_down' && e.targetSupplier === sId && e.remainingRounds > 0);
      });

      const newDemand = generateDemand(nextRound, level);
      const demandMult = getDemandMultiplierFromEvents(newEvents);

      // Check for concept tutorial
      const conceptKeys = Object.keys(CONCEPTS);
      let pendingConcept = null;
      for (const key of conceptKeys) {
        if (CONCEPTS[key].trigger === nextRound && !s.shownConcepts.includes(key)) {
          pendingConcept = key;
          break;
        }
      }

      return {
        ...s,
        round: nextRound,
        phase: pendingConcept ? 'concept' : 'playing',
        pendingConcept,
        currentDemand: newDemand,
        forecast: generateForecast(Math.round(newDemand * demandMult), nextRound),
        activeEvents: newEvents,
        disabledSuppliers,
        eventLog,
        demandMultiplier: demandMult,
        roundSummary: null,
        tips: [],
      };
    }

    case 'DISMISS_EVENT': {
      const conceptKeys = Object.keys(CONCEPTS);
      let pendingConcept = null;
      for (const key of conceptKeys) {
        if (CONCEPTS[key].trigger === state.round && !state.shownConcepts.includes(key)) {
          pendingConcept = key;
          break;
        }
      }
      return {
        ...state,
        phase: pendingConcept ? 'concept' : 'playing',
        pendingConcept,
        pendingEventInfo: null,
      };
    }

    case 'START_QUIZ':
      return { ...state, phase: 'quiz', quizAnswers: [] };

    case 'ANSWER_QUIZ': {
      const newAnswers = [...state.quizAnswers, action.answer];
      if (newAnswers.length >= QUIZ_QUESTIONS.length) {
        return { ...state, quizAnswers: newAnswers, phase: 'final_score' };
      }
      return { ...state, quizAnswers: newAnswers };
    }

    case 'RESTART':
      return createInitialState();

    default:
      return state;
  }
}

// ─── ICON COMPONENT MAP ──────────────────────────────────

const IconMap = { Ship, Factory, TrendingUp, AlertTriangle, Truck, Plane };

// ─── HELP TOOLTIP COMPONENT ──────────────────────────────

function HelpTooltip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-gray-300 hover:text-teal transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-40 top-full left-0 mt-2 w-72 bg-navy text-white text-xs rounded-lg p-3 shadow-xl leading-relaxed whitespace-pre-line">
          {text}
          <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-navy" />
        </div>
      )}
    </div>
  );
}

// ─── PANEL HELP TEXT ────────────────────────────────────

const PANEL_HELP = {
  demand: 'This shows how many units customers want to buy this round. The forecast is an estimate for next round (it\'s intentionally imperfect). Use the trend indicator and history chart to plan your orders ahead of time.',
  suppliers: 'Order raw materials here. Each supplier has different trade-offs:\n• Cost — price per unit\n• Lead Time — rounds until delivery\n• Reliability — chance the order arrives on time (otherwise delayed 1 round)\n• Quality — % of units that are usable (rest are defective)\nYou can order from multiple suppliers in the same round.',
  warehouse: 'Your inventory storage. Units you order from suppliers arrive here after their lead time. Holding inventory costs $0.50/unit/round, so don\'t overstock — but running out means you can\'t fulfill orders.',
  shipping: 'Choose how to ship orders to customers. Faster shipping costs more per unit but reduces the chance of late delivery penalties ($1.50/unit late). Ground is cheapest but 25% of units risk late penalties. Air freight has zero late risk but costs $5/unit.',
  financials: 'Your profit and loss statement. Revenue comes from fulfilled orders ($15/unit). Costs include procurement (supplier orders), shipping, holding (inventory storage), and penalties (stockouts + late deliveries). Go bankrupt and the game ends.',
  bullwhip: 'This chart compares what customers actually ordered (teal) vs. what you ordered from suppliers (amber). If your orders swing much more than demand, you\'re experiencing the bullwhip effect — try to order more steadily.',
};

// ─── SUB-COMPONENTS ───────────────────────────────────────

function TopBar({ state }) {
  const level = getLevelInfo(state.round);
  const fillRate = state.totalDemanded > 0
    ? Math.round((state.totalFulfilled / state.totalDemanded) * 100)
    : 100;

  return (
    <div className="bg-navy text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-teal-light" />
          <h1 className="text-xl font-bold tracking-tight">Supply Chain Tycoon</h1>
        </div>
        <div className="h-6 w-px bg-white/20" />
        <div className="flex items-center gap-1 text-sm">
          <Clock className="w-4 h-4 text-teal-light" />
          <span className="font-medium">Round {state.round}/{TOTAL_ROUNDS}</span>
        </div>
        <div className="bg-navy-light px-3 py-1 rounded-full text-sm font-medium">
          Level {level.index + 1}: {level.name}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="font-semibold">{formatCurrency(Math.floor(state.cash))}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber" />
          <span className="font-semibold">{Math.round(state.satisfaction)}% Satisfaction</span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-teal-light" />
          <span className="text-sm">Fill Rate: {fillRate}%</span>
        </div>
      </div>
    </div>
  );
}

function ConceptPopup({ conceptKey, onDismiss }) {
  const concept = CONCEPTS[conceptKey];
  if (!concept) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center">
            <Info className="w-5 h-5 text-teal" />
          </div>
          <h2 className="text-2xl font-bold text-navy">New Concept: {concept.title}</h2>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <p className="text-gray-700 leading-relaxed">{concept.explanation}</p>
        </div>
        <div className="bg-teal/5 border border-teal/20 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-teal-dark mb-1">Real-World Example</p>
          <p className="text-sm text-gray-600">{concept.realWorld}</p>
        </div>
        <button
          onClick={onDismiss}
          className="w-full bg-teal text-white py-3 rounded-lg font-semibold hover:bg-teal-dark transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

function DemandPanel({ state }) {
  const recentDemand = state.demandHistory.slice(-5);
  const chartData = recentDemand.map((d, i) => ({
    round: state.round - recentDemand.length + i,
    demand: d,
  }));
  const trend = getDemandTrend(state.demandHistory);
  const effectiveDemand = Math.round(state.currentDemand * state.demandMultiplier);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5 text-teal" />
        <h3 className="font-bold text-navy">Customer Demand</h3>
        <HelpTooltip text={PANEL_HELP.demand} />
      </div>
      <div className="mb-3">
        <div className="text-3xl font-bold text-navy">{effectiveDemand} units</div>
        <div className="text-sm text-gray-500">orders this round</div>
        {state.demandMultiplier > 1 && (
          <div className="text-xs text-amber-dark font-semibold mt-1">
            Demand surge active! ({state.demandMultiplier}x normal)
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">Forecast: ~{state.forecast} units</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          trend === 'Rising' ? 'bg-green-100 text-green-700' :
          trend === 'Falling' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {trend}
        </span>
      </div>
      {chartData.length > 0 && (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="round" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="demand" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function SupplierPanel({ state, dispatch }) {
  const level = getLevel(state.round);
  const availableSuppliers = SUPPLIERS.filter(s => s.unlockLevel <= level);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Factory className="w-5 h-5 text-teal" />
        <h3 className="font-bold text-navy">Suppliers</h3>
        <HelpTooltip text={PANEL_HELP.suppliers} />
      </div>
      <div className="space-y-3">
        {availableSuppliers.map(supplier => {
          const isDisabled = state.disabledSuppliers.includes(supplier.id);
          const overseasDelay = supplier.location === 'Overseas' && state.activeEvents.find(e => e.effect === 'overseas_delay' && e.remainingRounds > 0);
          const effectiveLeadTime = supplier.leadTime + (overseasDelay ? overseasDelay.extraLeadTime : 0);

          return (
            <div key={supplier.id} className={`border rounded-lg p-3 ${isDisabled ? 'bg-red-50 border-red-200 opacity-60' : 'border-gray-200 hover:border-teal/50'} transition-colors`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-navy">{supplier.name}</span>
                {isDisabled && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Unavailable</span>}
                {supplier.location === 'Overseas' && !isDisabled && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Overseas
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mb-2">
                <span>Cost: <strong className="text-navy">${supplier.cost}/unit</strong></span>
                <span>Lead Time: <strong className={`${overseasDelay ? 'text-amber-dark' : 'text-navy'}`}>{effectiveLeadTime} rnd{effectiveLeadTime > 1 ? 's' : ''}</strong></span>
                <span>Reliability: <strong className="text-navy">{Math.round(supplier.reliability * 100)}%</strong></span>
                <span>Quality: <strong className="text-navy">{Math.round(supplier.quality * 100)}%</strong></span>
              </div>
              {!isDisabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    placeholder="Qty"
                    value={state.supplierOrders[supplier.id] || ''}
                    onChange={e => dispatch({ type: 'SET_SUPPLIER_ORDER', supplierId: supplier.id, qty: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                  <span className="text-xs text-gray-500">
                    = {formatCurrency((state.supplierOrders[supplier.id] || 0) * supplier.cost)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WarehousePanel({ state }) {
  const inTransitTotal = state.inTransitShipments.reduce((sum, s) => sum + s.qty, 0);
  const fillPct = Math.min(100, (state.inventory / state.warehouseCapacity) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Warehouse className="w-5 h-5 text-teal" />
        <h3 className="font-bold text-navy">Warehouse</h3>
        <HelpTooltip text={PANEL_HELP.warehouse} />
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Inventory</span>
          <span className="font-bold text-navy">{state.inventory} / {state.warehouseCapacity}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              fillPct > 90 ? 'bg-amber' : fillPct > 70 ? 'bg-teal' : fillPct > 30 ? 'bg-teal-light' : 'bg-red-400'
            }`}
            style={{ width: `${fillPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(10, Math.ceil(fillPct / 10)) }).map((_, i) => (
                <Box key={i} className="w-3 h-3 text-white/70" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-gray-500 text-xs">On Hand</div>
          <div className="font-bold text-navy">{state.inventory} units</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-gray-500 text-xs">In Transit</div>
          <div className="font-bold text-navy">{inTransitTotal} units</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-gray-500 text-xs">Capacity</div>
          <div className="font-bold text-navy">{state.warehouseCapacity} units</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-gray-500 text-xs">Holding Cost</div>
          <div className="font-bold text-navy">${HOLDING_COST}/unit/rnd</div>
        </div>
      </div>
      {state.inTransitShipments.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 font-medium mb-1">Incoming Shipments:</div>
          {state.inTransitShipments.map((s, i) => {
            const supplier = SUPPLIERS.find(sp => sp.id === s.supplierId);
            return (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600 py-0.5">
                <Truck className="w-3 h-3 text-teal" />
                <span>{s.qty} units from {supplier.name}</span>
                <span className="text-gray-400">— arrives round {s.arrivedRound}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ShippingPanel({ state, dispatch }) {
  const level = getLevel(state.round);
  const availableMethods = SHIPPING_METHODS.filter(m => m.unlockLevel <= level);
  const effectiveDemand = Math.round(state.currentDemand * state.demandMultiplier);
  const maxFulfill = Math.min(state.inventory, effectiveDemand);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-teal" />
        <h3 className="font-bold text-navy">Fulfillment & Shipping</h3>
        <HelpTooltip text={PANEL_HELP.shipping} />
      </div>
      <div className="mb-3">
        <div className="text-sm text-gray-600 mb-2">
          Pending Orders: <strong className="text-navy">{effectiveDemand} units</strong>
          <span className="text-gray-400 ml-2">| Can fulfill: {maxFulfill} units</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm text-gray-600">Fulfill:</label>
          <input
            type="number"
            min="0"
            max={maxFulfill}
            value={state.fulfillQty || ''}
            onChange={e => dispatch({ type: 'SET_FULFILL_QTY', qty: Math.max(0, Math.min(maxFulfill, parseInt(e.target.value) || 0)) })}
            className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
          />
          <button
            onClick={() => dispatch({ type: 'SET_FULFILL_QTY', qty: maxFulfill })}
            className="text-xs bg-teal/10 text-teal px-2 py-1 rounded hover:bg-teal/20 transition-colors"
          >
            Max
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-medium">Shipping Method:</div>
        {availableMethods.map(method => {
          const MethodIcon = method.id === 'air' ? Plane : Truck;
          return (
            <label
              key={method.id}
              className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                state.selectedShipping === method.id
                  ? 'border-teal bg-teal/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="shipping"
                value={method.id}
                checked={state.selectedShipping === method.id}
                onChange={() => dispatch({ type: 'SET_SHIPPING', method: method.id })}
                className="sr-only"
              />
              <MethodIcon className={`w-4 h-4 ${state.selectedShipping === method.id ? 'text-teal' : 'text-gray-400'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium">{method.name}</div>
                <div className="text-xs text-gray-500">
                  ${method.cost}/unit · {method.latePenaltyPct === 0 ? 'No late risk' : `${Math.round(method.latePenaltyPct * 100)}% late risk`}
                </div>
              </div>
              {state.selectedShipping === method.id && (
                <CheckCircle className="w-4 h-4 text-teal" />
              )}
            </label>
          );
        })}
      </div>
      {state.fulfillQty > 0 && (() => {
        const selMethod = SHIPPING_METHODS.find(m => m.id === state.selectedShipping);
        const estLate = Math.floor(state.fulfillQty * selMethod.latePenaltyPct);
        return (
          <div className="mt-3 bg-slate-50 rounded-lg p-2 text-sm space-y-1">
            <div>
              <span className="text-gray-600">Shipping cost: </span>
              <span className="font-bold text-navy">
                {formatCurrency(state.fulfillQty * selMethod.cost)}
              </span>
            </div>
            {estLate > 0 && (
              <div className="text-xs text-amber-dark">
                Est. ~{estLate} units may arrive late (+{formatCurrency(estLate * LATE_PENALTY)} penalty risk)
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function FinancialsPanel({ state }) {
  const f = state.financials;
  const totalCosts = f.totalProcurement + f.totalHolding + f.totalShipping + f.totalPenalties;
  const netProfit = f.totalRevenue - totalCosts;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-teal" />
        <h3 className="font-bold text-navy">Financials</h3>
        <HelpTooltip text={PANEL_HELP.financials} />
      </div>
      {state.round > 1 && (
        <div className="mb-3 bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 font-medium mb-1">Last Round</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-gray-600">Revenue:</span>
            <span className="text-right font-medium text-green-600">+{formatCurrency(f.roundRevenue)}</span>
            <span className="text-gray-600">Procurement:</span>
            <span className="text-right font-medium text-red-500">-{formatCurrency(f.roundProcurement)}</span>
            <span className="text-gray-600">Shipping:</span>
            <span className="text-right font-medium text-red-500">-{formatCurrency(f.roundShipping)}</span>
            <span className="text-gray-600">Holding:</span>
            <span className="text-right font-medium text-red-500">-{formatCurrency(f.roundHolding)}</span>
            <span className="text-gray-600">Penalties:</span>
            <span className="text-right font-medium text-red-500">-{formatCurrency(f.roundPenalties)}</span>
          </div>
        </div>
      )}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Revenue</span>
          <span className="font-medium text-green-600">{formatCurrency(f.totalRevenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Costs</span>
          <span className="font-medium text-red-500">-{formatCurrency(totalCosts)}</span>
        </div>
        <div className="h-px bg-gray-200 my-1" />
        <div className="flex justify-between">
          <span className="font-semibold text-navy">Net Profit</span>
          <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
          </span>
        </div>
        <div className="flex justify-between pt-1">
          <span className="font-semibold text-navy">Cash Balance</span>
          <span className="font-bold text-navy">{formatCurrency(Math.floor(state.cash))}</span>
        </div>
      </div>
      {state.cashHistory.length > 1 && (
        <div className="mt-3 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={state.cashHistory}>
              <defs>
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="round" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Area type="monotone" dataKey="cash" stroke="#14b8a6" fill="url(#cashGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function BullwhipChart({ state }) {
  const level = getLevel(state.round);
  if (level < 2 || state.demandHistory.length < 3) return null;

  const data = state.demandHistory.map((d, i) => ({
    round: i + 1,
    demand: d,
    ordered: state.orderHistory[i] || 0,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber" />
        <h3 className="font-bold text-navy">Bullwhip Effect Monitor</h3>
        <HelpTooltip text={PANEL_HELP.bullwhip} />
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Compare your order quantities vs. actual customer demand. Large divergences indicate the bullwhip effect.
      </p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="round" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="demand" stroke="#14b8a6" strokeWidth={2} name="Customer Demand" dot={false} />
            <Line type="monotone" dataKey="ordered" stroke="#f59e0b" strokeWidth={2} name="Your Orders" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ActiveEventsBar({ events }) {
  const active = events.filter(e => e.remainingRounds > 0);
  if (active.length === 0) return null;

  return (
    <div className="bg-amber/10 border border-amber/30 rounded-lg px-4 py-2 flex items-center gap-4 flex-wrap">
      <AlertTriangle className="w-4 h-4 text-amber-dark flex-shrink-0" />
      <span className="text-sm font-medium text-amber-dark">Active Events:</span>
      {active.map((evt, i) => (
        <span key={i} className="text-xs bg-amber/20 text-amber-dark px-2 py-0.5 rounded-full">
          {evt.title} ({evt.remainingRounds} rnd{evt.remainingRounds > 1 ? 's' : ''} left)
        </span>
      ))}
    </div>
  );
}

function RoundSummary({ summary, tips, onNext, isLastRound }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <h2 className="text-2xl font-bold text-navy mb-4">Round {summary.round} Summary</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Demand</div>
            <div className="text-xl font-bold text-navy">{summary.demand}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Fulfilled</div>
            <div className="text-xl font-bold text-green-600">{summary.fulfilled}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Unfulfilled</div>
            <div className={`text-xl font-bold ${summary.unfulfilled > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {summary.unfulfilled}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Fill Rate</div>
            <div className={`text-xl font-bold ${summary.fillRate >= 90 ? 'text-green-600' : summary.fillRate >= 70 ? 'text-amber' : 'text-red-500'}`}>
              {summary.fillRate}%
            </div>
          </div>
          {summary.lateUnits > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 col-span-2">
              <div className="text-xs text-amber-dark">Late Deliveries</div>
              <div className="text-lg font-bold text-amber-dark">{summary.lateUnits} units (penalty: {formatCurrency(summary.lateUnits * LATE_PENALTY)})</div>
            </div>
          )}
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Revenue</span>
          <span className="font-medium text-green-600">+{formatCurrency(summary.revenue)}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Total Costs</span>
          <span className="font-medium text-red-500">-{formatCurrency(summary.costs)}</span>
        </div>
        <div className="h-px bg-gray-200 mb-2" />
        <div className="flex justify-between text-sm mb-4">
          <span className="font-semibold text-navy">Net Profit</span>
          <span className={`font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {summary.profit >= 0 ? '+' : ''}{formatCurrency(Math.floor(summary.profit))}
          </span>
        </div>
        {tips.length > 0 && (
          <div className="bg-amber/10 border border-amber/20 rounded-lg p-3 mb-4">
            <div className="text-xs font-semibold text-amber-dark mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Insights
            </div>
            {tips.map((tip, i) => (
              <p key={i} className="text-xs text-gray-700 mb-1 last:mb-0">{tip}</p>
            ))}
          </div>
        )}
        <button
          onClick={onNext}
          className="w-full bg-teal text-white py-3 rounded-lg font-semibold hover:bg-teal-dark transition-colors flex items-center justify-center gap-2"
        >
          {isLastRound ? 'View Final Results' : 'Next Round'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EndSummary({ state, onStartQuiz }) {
  const f = state.financials;
  const totalCosts = f.totalProcurement + f.totalHolding + f.totalShipping + f.totalPenalties;
  const fillRate = state.totalDemanded > 0 ? Math.round((state.totalFulfilled / state.totalDemanded) * 100) : 100;

  const costBreakdown = [
    { name: 'Procurement', value: Math.round(f.totalProcurement), color: '#1b2a4a' },
    { name: 'Holding', value: Math.round(f.totalHolding), color: '#14b8a6' },
    { name: 'Shipping', value: Math.round(f.totalShipping), color: '#f59e0b' },
    { name: 'Penalties', value: Math.round(f.totalPenalties), color: '#ef4444' },
  ];

  const conceptsList = Object.entries(CONCEPTS).map(([key, concept]) => ({
    ...concept,
    key,
    experienced: state.shownConcepts.includes(key) || state.round >= concept.trigger,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-dark p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Award className="w-16 h-16 text-amber mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">
            {state.gameWon ? 'Congratulations!' : 'Game Complete'}
          </h1>
          <p className="text-white/70">
            {state.gameWon
              ? 'You successfully managed your supply chain across all 30 rounds!'
              : 'Your supply chain journey has ended. Review your performance below.'}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{formatCurrency(Math.floor(state.cash))}</div>
            <div className="text-white/60 text-sm">Final Cash</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{formatCurrency(Math.round(f.totalRevenue))}</div>
            <div className="text-white/60 text-sm">Total Revenue</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{Math.round(state.satisfaction)}%</div>
            <div className="text-white/60 text-sm">Satisfaction</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{fillRate}%</div>
            <div className="text-white/60 text-sm">Fill Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-5">
            <h3 className="font-bold text-navy mb-3">Cash Over Time</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={state.cashHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="round" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Area type="monotone" dataKey="cash" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5">
            <h3 className="font-bold text-navy mb-3">Cost Breakdown</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {costBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {state.demandHistory.length > 3 && (
          <div className="bg-white rounded-xl p-5 mb-6">
            <h3 className="font-bold text-navy mb-3">Bullwhip Effect Analysis</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={state.demandHistory.map((d, i) => ({ round: i + 1, demand: d, ordered: state.orderHistory[i] || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="round" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="demand" stroke="#14b8a6" strokeWidth={2} name="Customer Demand" dot={false} />
                  <Line type="monotone" dataKey="ordered" stroke="#f59e0b" strokeWidth={2} name="Your Orders" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 mb-6">
          <h3 className="font-bold text-navy mb-3">Concepts Learned</h3>
          <div className="grid grid-cols-2 gap-2">
            {conceptsList.map(concept => (
              <div key={concept.key} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                {concept.experienced
                  ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />}
                <div>
                  <div className="text-sm font-medium text-navy">{concept.title}</div>
                  <div className="text-xs text-gray-500">{concept.explanation.split('.')[0]}.</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onStartQuiz}
            className="bg-teal text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-dark transition-colors text-lg"
          >
            Take the Final Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizScreen({ state, dispatch }) {
  const currentQ = state.quizAnswers.length;
  if (currentQ >= QUIZ_QUESTIONS.length) return null;

  const question = QUIZ_QUESTIONS[currentQ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-dark flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-500">Question {currentQ + 1} of {QUIZ_QUESTIONS.length}</span>
          <div className="flex gap-1">
            {QUIZ_QUESTIONS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < currentQ ? 'bg-teal' : i === currentQ ? 'bg-amber' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
        <h2 className="text-xl font-bold text-navy mb-6">{question.question}</h2>
        <div className="space-y-3">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => dispatch({ type: 'ANSWER_QUIZ', answer: i })}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-teal hover:bg-teal/5 transition-colors text-sm"
            >
              <span className="font-medium text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinalScore({ state, onRestart }) {
  const quizScore = state.quizAnswers.reduce((score, ans, i) => {
    return score + (ans === QUIZ_QUESTIONS[i].correct ? 1 : 0);
  }, 0);
  const quizPct = (quizScore / QUIZ_QUESTIONS.length) * 100;

  const cashScore = Math.min(100, Math.max(0, (state.cash / STARTING_CASH) * 100));
  const avgSatisfaction = state.satisfactionHistory.length > 0
    ? state.satisfactionHistory.reduce((s, h) => s + h.satisfaction, 0) / state.satisfactionHistory.length
    : state.satisfaction;

  const finalScore = Math.round((cashScore / 100) * 40 + (avgSatisfaction / 100) * 40 + (quizPct / 100) * 20);

  let grade, gradeColor;
  if (finalScore >= 90) { grade = 'A'; gradeColor = 'text-green-500'; }
  else if (finalScore >= 80) { grade = 'B'; gradeColor = 'text-teal'; }
  else if (finalScore >= 70) { grade = 'C'; gradeColor = 'text-amber'; }
  else if (finalScore >= 60) { grade = 'D'; gradeColor = 'text-amber-dark'; }
  else { grade = 'F'; gradeColor = 'text-red-500'; }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-dark flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-2xl text-center">
        <Award className="w-20 h-20 text-amber mx-auto mb-4" />
        <div className={`text-8xl font-black ${gradeColor} mb-2`}>{grade}</div>
        <div className="text-3xl font-bold text-navy mb-6">Final Score: {finalScore}/100</div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Financial (40%)</div>
            <div className="text-lg font-bold text-navy">{Math.round(cashScore)}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Satisfaction (40%)</div>
            <div className="text-lg font-bold text-navy">{Math.round(avgSatisfaction)}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Quiz (20%)</div>
            <div className="text-lg font-bold text-navy">{quizScore}/{QUIZ_QUESTIONS.length}</div>
          </div>
        </div>

        <div className="text-left mb-6">
          <h3 className="font-bold text-navy mb-3">Quiz Review</h3>
          {QUIZ_QUESTIONS.map((q, i) => (
            <div key={i} className="mb-3 p-3 rounded-lg bg-slate-50">
              <div className="flex items-start gap-2">
                {state.quizAnswers[i] === q.correct
                  ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                <div>
                  <div className="text-sm font-medium text-navy">{q.question}</div>
                  <div className="text-xs text-green-600 mt-1">Correct: {q.options[q.correct]}</div>
                  {state.quizAnswers[i] !== q.correct && (
                    <div className="text-xs text-red-500">Your answer: {q.options[state.quizAnswers[i]]}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="w-full bg-teal text-white py-3 rounded-lg font-semibold hover:bg-teal-dark transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
      </div>
    </div>
  );
}

function GameOverScreen({ state, onRestart }) {
  const reason = state.cash <= 0
    ? 'You ran out of money! Your company has gone bankrupt.'
    : 'Customer satisfaction dropped too low. Your customers have abandoned you.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-navy-dark flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-2xl text-center">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-navy mb-2">Game Over</h1>
        <p className="text-gray-600 mb-2">Round {state.round} of {TOTAL_ROUNDS}</p>
        <p className="text-gray-700 mb-6">{reason}</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Final Cash</div>
            <div className="text-xl font-bold text-red-500">{formatCurrency(Math.floor(state.cash))}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Satisfaction</div>
            <div className="text-xl font-bold text-red-500">{Math.round(state.satisfaction)}%</div>
          </div>
        </div>
        <div className="bg-amber/10 border border-amber/20 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700 font-medium mb-2">Tips for next time:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>Keep safety stock to avoid costly stockout penalties</li>
            <li>Balance ordering — don't over-react to demand changes</li>
            <li>Watch your total costs, not just procurement price</li>
            <li>Plan ahead for supplier lead times</li>
          </ul>
        </div>
        <button
          onClick={onRestart}
          className="w-full bg-teal text-white py-3 rounded-lg font-semibold hover:bg-teal-dark transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  );
}

function TitleScreen({ onStart }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy via-navy-dark to-navy flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Package className="w-16 h-16 text-teal-light" />
          </div>
          <h1 className="text-6xl font-black text-white mb-4 tracking-tight">
            Supply Chain<br />
            <span className="text-teal-light">Tycoon</span>
          </h1>
          <p className="text-xl text-white/60 max-w-md mx-auto">
            Master the art of supply chain management through hands-on simulation
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto text-left">
          {[
            { icon: ShoppingCart, text: 'Forecast demand & manage orders' },
            { icon: Factory, text: 'Source from multiple suppliers' },
            { icon: Warehouse, text: 'Optimize your inventory' },
            { icon: Zap, text: 'Survive supply disruptions' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
              <Icon className="w-5 h-5 text-teal-light flex-shrink-0" />
              <span className="text-sm text-white/80">{text}</span>
            </div>
          ))}
        </div>

        <div className="mb-6 bg-white/5 rounded-xl p-4 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-teal-light mb-2">How to Play</h3>
          <ul className="text-sm text-white/60 space-y-1 text-left">
            <li>1. Each round represents one week of operations</li>
            <li>2. Order materials from suppliers to build inventory</li>
            <li>3. Fulfill customer orders to earn revenue</li>
            <li>4. Manage costs and keep customers satisfied</li>
            <li>5. Survive 30 rounds to win!</li>
          </ul>
        </div>

        <button
          onClick={onStart}
          className="bg-teal text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-teal-dark transition-all shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
        >
          <Play className="w-6 h-6" /> Start Game
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP COMPONENT ───────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  const handleEndTurn = useCallback(() => {
    dispatch({ type: 'PROCESS_ROUND' });
  }, []);

  const handleNextRound = useCallback(() => {
    dispatch({ type: 'NEXT_ROUND' });
  }, []);

  // Title screen
  if (state.phase === 'title') {
    return <TitleScreen onStart={() => dispatch({ type: 'START_GAME' })} />;
  }

  // Game over
  if (state.phase === 'gameover') {
    return <GameOverScreen state={state} onRestart={() => dispatch({ type: 'RESTART' })} />;
  }

  // End summary
  if (state.phase === 'end_summary') {
    return <EndSummary state={state} onStartQuiz={() => dispatch({ type: 'START_QUIZ' })} />;
  }

  // Quiz
  if (state.phase === 'quiz') {
    return <QuizScreen state={state} dispatch={dispatch} />;
  }

  // Final score
  if (state.phase === 'final_score') {
    return <FinalScore state={state} onRestart={() => dispatch({ type: 'RESTART' })} />;
  }

  // Main game UI
  const effectiveDemand = Math.round(state.currentDemand * state.demandMultiplier);
  const totalOrderCost = Object.entries(state.supplierOrders).reduce((sum, [id, qty]) => {
    const supplier = SUPPLIERS.find(s => s.id === id);
    return sum + (supplier ? qty * supplier.cost : 0);
  }, 0);
  const shippingCost = state.fulfillQty * (SHIPPING_METHODS.find(m => m.id === state.selectedShipping)?.cost || 0);

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
      <TopBar state={state} />

      {/* Active events bar */}
      {state.activeEvents.length > 0 && (
        <div className="px-6 pt-3">
          <ActiveEventsBar events={state.activeEvents} />
        </div>
      )}

      {/* Event popup */}
      {state.phase === 'event' && state.pendingEventInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-dark" />
              </div>
              <h2 className="text-2xl font-bold text-navy">{state.pendingEventInfo.title}</h2>
            </div>
            <p className="text-gray-700 mb-6">{state.pendingEventInfo.description}</p>
            {state.pendingEventInfo.effect === 'inventory_loss' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                {Math.floor(state.pendingEventInfo.lossPct * 100)}% of your inventory has been discarded.
              </div>
            )}
            <button
              onClick={() => dispatch({ type: 'DISMISS_EVENT' })}
              className="w-full bg-navy text-white py-3 rounded-lg font-semibold hover:bg-navy-light transition-colors"
            >
              Adapt & Continue
            </button>
          </div>
        </div>
      )}

      {/* Concept popup */}
      {state.phase === 'concept' && state.pendingConcept && (
        <ConceptPopup
          conceptKey={state.pendingConcept}
          onDismiss={() => dispatch({ type: 'DISMISS_CONCEPT' })}
        />
      )}

      {/* Round summary */}
      {state.phase === 'round_summary' && state.roundSummary && (
        <RoundSummary
          summary={state.roundSummary}
          tips={state.tips}
          onNext={handleNextRound}
          isLastRound={state.round >= TOTAL_ROUNDS}
        />
      )}

      {/* Main game grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-12 gap-4 max-w-[1600px] mx-auto">
          {/* Left column - Demand + Suppliers */}
          <div className="col-span-3 space-y-4">
            <DemandPanel state={state} />
            <SupplierPanel state={state} dispatch={dispatch} />
          </div>

          {/* Center column - Warehouse + Shipping + Action */}
          <div className="col-span-5 space-y-4">
            <WarehousePanel state={state} />
            <ShippingPanel state={state} dispatch={dispatch} />

            {/* End turn action */}
            {(state.phase === 'playing') && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-navy">Ready to End Round {state.round}?</h3>
                    <p className="text-xs text-gray-500">Review your orders and fulfillment before proceeding.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="bg-slate-50 rounded p-2">
                    <span className="text-gray-500">Order Cost</span>
                    <div className="font-bold text-navy">{formatCurrency(totalOrderCost)}</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <span className="text-gray-500">Ship Cost</span>
                    <div className="font-bold text-navy">{formatCurrency(shippingCost)}</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <span className="text-gray-500">Est. Revenue</span>
                    <div className="font-bold text-green-600">{formatCurrency(state.fulfillQty * REVENUE_PER_UNIT)}</div>
                  </div>
                </div>
                {state.fulfillQty < effectiveDemand && state.fulfillQty < state.inventory && (
                  <div className="bg-amber/10 border border-amber/20 rounded-lg p-2 mb-3 text-xs text-amber-dark flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    You can fulfill more orders! Unfulfilled orders incur a ${STOCKOUT_PENALTY}/unit penalty.
                  </div>
                )}
                <button
                  onClick={handleEndTurn}
                  className="w-full bg-navy text-white py-3 rounded-lg font-semibold hover:bg-navy-light transition-colors flex items-center justify-center gap-2"
                >
                  End Round <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bullwhip chart */}
            <BullwhipChart state={state} />
          </div>

          {/* Right column - Financials */}
          <div className="col-span-4 space-y-4">
            <FinancialsPanel state={state} />

            {/* Quick reference card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-teal" />
                <h3 className="font-bold text-navy text-sm">Quick Reference</h3>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between"><span>Revenue per unit:</span><span className="font-medium">${REVENUE_PER_UNIT}</span></div>
                <div className="flex justify-between"><span>Holding cost:</span><span className="font-medium">${HOLDING_COST}/unit/round</span></div>
                <div className="flex justify-between"><span>Stockout penalty:</span><span className="font-medium">${STOCKOUT_PENALTY}/unit</span></div>
                <div className="flex justify-between"><span>Late delivery penalty:</span><span className="font-medium">${LATE_PENALTY}/unit</span></div>
              </div>
            </div>

            {/* Level progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-navy text-sm mb-3">Level Progress</h3>
              <div className="space-y-2">
                {LEVELS.map((l, i) => {
                  const level = getLevel(state.round);
                  const isCurrent = level === i;
                  const isComplete = state.round > l.rounds[1];
                  const progress = isCurrent
                    ? ((state.round - l.rounds[0]) / (l.rounds[1] - l.rounds[0] + 1)) * 100
                    : isComplete ? 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className={`font-medium ${isCurrent ? 'text-navy' : isComplete ? 'text-teal' : 'text-gray-400'}`}>
                          L{i + 1}: {l.name}
                        </span>
                        <span className="text-gray-400">Rnd {l.rounds[0]}-{l.rounds[1]}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-teal' : isCurrent ? 'bg-amber' : 'bg-gray-200'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
