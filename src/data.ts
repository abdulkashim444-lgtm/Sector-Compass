import { SectorIndex, MarketRegime, SectorDataPoint } from "./types";

// List of all 14 NSE Sectoral Indices
export const SECTOR_INDICES: SectorIndex[] = [
  "Nifty Bank",
  "Nifty Private Bank",
  "Nifty PSU Bank",
  "Nifty IT",
  "Nifty Auto",
  "Nifty Pharma",
  "Nifty Metal",
  "Nifty FMCG",
  "Nifty Energy",
  "Nifty Realty",
  "Nifty Media",
  "Nifty Financial Services",
  "Nifty Healthcare",
  "Nifty Consumer",
];

// Scenarios as documented in Section A8.1
export const SCENARIOS = [
  {
    id: "scen_taper_2013",
    name: "2013 Taper Tantrum",
    trigger: "US Fed signaling tapering of QE",
    description:
      "US Federal Reserve signals reduction in asset purchases, triggering high EM interest rate stress, capital flight, and USDINR depreciation from 55 to 68. Rate-sensitive sectors (Realty, Bank, Auto) fell 20-35%, while defensive INR-revenue beneficiaries (IT, Pharma) rallied 15-25%.",
    startDate: "2013-05-01",
    endDate: "2013-09-30",
    expectedPattern: "IT and Pharma outperforming; Realty and Banks sharply underperforming.",
  },
  {
    id: "scen_ilfs_2018",
    name: "2018 IL&FS Credit Crisis",
    trigger: "IL&FS Financial Services commercial paper default",
    description:
      "On 14 September 2018, IL&FS defaults on commercial paper, locking up shadow-banking liquidity. Nifty Private Bank and Realty crashed. Nifty PSU Bank rallied on safety-flight. Historical Banking-NBFC correlation collapsed from 0.85 to 0.30, causing extreme decorrelation.",
    startDate: "2018-09-14",
    endDate: "2018-12-15",
    expectedPattern: "PSU Banks and FMCG hold on relative safety; Private Banks and Financial Services underperform.",
  },
  {
    id: "scen_covid_2020",
    name: "2020 COVID & IT Rerating",
    trigger: "COVID pandemic lockdown + US fiscal stimulus",
    description:
      "Global lockdowns trigger a market crash in March 2020. This is followed by a massive IT Services outperformance driven by USD strength and global digital-transformation demand. Nifty IT rallied 145% vs Nifty 50's 95%.",
    startDate: "2020-03-01",
    endDate: "2021-10-31",
    expectedPattern: "IT and Healthcare/Pharma dramatic outperformance; Media and Financials underperforming.",
  },
  {
    id: "scen_psu_2023",
    name: "2023-24 PSU Bank & Capex Rally",
    trigger: "Government capital expenditure boost + bank recapitalisation",
    description:
      "A massive government balance-sheet recapitalisation, asset-quality improvement, and infrastructure spending drive an unprecedented rally in PSU Banks, Capital Goods/Capex, and Defence. A unique cluster emerges (PSU Bank + Capex + Metal).",
    startDate: "2023-01-01",
    endDate: "2024-05-15",
    expectedPattern: "PSU Banks, Metals, and Capex-linked sectors (Realty, Auto) outperforming.",
  },
  {
    id: "scen_election_2024",
    name: "2024 Election Verdict & Reversal",
    trigger: "Indian election results fall short of exit-poll predictions",
    description:
      "On 4 June 2024, election results come in below pre-poll forecasts. Capex/Reform-exposed sectors (PSU Banks, Metal, Defence) crash 8-15% on day one. Defensives (FMCG, Healthcare) surge on safety. Reassignment of attention and quick recovery occurs within days.",
    startDate: "2024-06-01",
    endDate: "2024-06-30",
    expectedPattern: "Severe day-one defensive flight, followed by swift recovery of capex and banking sectors.",
  },
];

// Campaign levels as documented in Section B1.3
export const CAM_LEVELS = [
  {
    level: 1,
    title: "The Relative Strength Ranker",
    objective: "Build a baseline sector ranker using rolling RS only.",
    scenarioId: "scen_taper_2013",
    unlockPoints: 0,
    minIc: 0.12,
    minIr: 0.2,
    requiredArchitecture: ["GCN", "GAT", "GATv2", "TGAT", "Relational GAT", "Signed GAT", "Regime-MoE"], // any
    requiredFeatures: ["momentum"],
    instructions: [
      "Select ONLY the 'Momentum & Trend' feature family.",
      "Run the backtest on the 2013 Taper Tantrum scenario.",
      "Achieve a positive 63-day Information Coefficient (IC) above 0.12.",
    ],
  },
  {
    level: 2,
    title: "The Multi-Feature Strategist",
    objective: "Add momentum, volatility, breadth, and macro-sensitivity features.",
    scenarioId: "scen_taper_2013",
    unlockPoints: 150,
    minIc: 0.18,
    minIr: 0.35,
    requiredArchitecture: ["GCN", "GAT", "GATv2", "TGAT", "Relational GAT", "Signed GAT", "Regime-MoE"],
    requiredFeatures: ["momentum", "volatility", "breadth", "macro"],
    instructions: [
      "Enable multiple feature families: Momentum, Volatility, Breadth, and Macro Sensitivity.",
      "Run the backtest. Observe how capturing multiple channels improves the Information Coefficient by over 50%.",
    ],
  },
  {
    level: 3,
    title: "The Correlation Graph Builder",
    objective: "Construct a correlation-threshold sector graph and run a 2-layer GCN.",
    scenarioId: "scen_ilfs_2018",
    unlockPoints: 300,
    minIc: 0.22,
    minIr: 0.45,
    requiredArchitecture: ["GCN"],
    requiredFeatures: ["momentum", "volatility", "breadth"],
    instructions: [
      "Choose 'GCN' (Graph Convolutional Network) as your architecture.",
      "Select 'correlation' as your Adjacency Base Method to link historically correlated sectors.",
      "Identify the GCN's ability to propagate structural bank-NBFC shocks through the connected nodes.",
    ],
  },
  {
    level: 4,
    title: "The Attention Engineer",
    objective: "Train a GAT / GATv2 on the sector graph. Achieve attention stability across the 2018 IL&FS episode.",
    scenarioId: "scen_ilfs_2018",
    unlockPoints: 450,
    minIc: 0.28,
    minIr: 0.55,
    requiredArchitecture: ["GAT", "GATv2"],
    requiredFeatures: ["momentum", "volatility", "breadth", "macro"],
    instructions: [
      "Switch to GAT or GATv2 architecture to dynamically learn attention weights.",
      "Observe the attention collapse between Banking and Financials/NBFCs as the credit crisis hits.",
      "Inspect the dynamic edge weights in the interactive sector graph.",
    ],
  },
  {
    level: 5,
    title: "The Temporal Architect",
    objective: "Add TGAT temporal extension with learned time encoding.",
    scenarioId: "scen_covid_2020",
    unlockPoints: 600,
    minIc: 0.32,
    minIr: 0.7,
    requiredArchitecture: ["TGAT"],
    requiredFeatures: ["momentum", "volatility", "breadth", "macro"],
    instructions: [
      "Select 'TGAT' to enable Bochner-style time-encoded attention.",
      "Test on the 2020 COVID & IT Rerating scenario.",
      "Verify that temporal attention adapts faster to the structural tech-cycle pivots than static models.",
    ],
  },
  {
    level: 6,
    title: "The Uncertainty Champion",
    objective: "Implement MC-dropout and conformal top-k sets for confidence-gated overlays.",
    scenarioId: "scen_covid_2020",
    unlockPoints: 750,
    minIc: 0.32,
    minIr: 0.8,
    requiredArchitecture: ["TGAT", "Relational GAT", "Signed GAT", "Regime-MoE"],
    requiredFeatures: ["momentum", "volatility", "breadth", "macro"],
    instructions: [
      "Set Conformal Alpha to 0.1 to guarantee that truly outperforming sectors are captured within confidence sets.",
      "Enable 'MC Dropout Samples' (at least 30) to compute epistemic predictive variance.",
      "Observe the conformal candidate set widening during peak 2020 volatility.",
    ],
  },
  {
    level: 7,
    title: "The Allocation Designer",
    objective: "Connect rankings to a sector overlay with realistic Indian transaction costs.",
    scenarioId: "scen_psu_2023",
    unlockPoints: 875,
    minIc: 0.35,
    minIr: 0.9,
    requiredArchitecture: ["Relational GAT", "Signed GAT", "Regime-MoE"],
    requiredFeatures: ["momentum", "volatility", "breadth", "macro"],
    instructions: [
      "Select an advanced architecture: Relational GAT, Signed GAT, or Regime-MoE.",
      "Implement the asset allocation overlay backtest with standard 60bps round-trip transaction costs.",
      "Verify that your model generates positive Information Ratio after transaction costs during the 2023-24 PSU rally.",
    ],
  },
  {
    level: 8,
    title: "The Regulator's Choice",
    objective: "Survive a simulated SEBI inspection with full attention lineage and post-trade attribution.",
    scenarioId: "scen_election_2024",
    unlockPoints: 950,
    minIc: 0.38,
    minIr: 1.0,
    requiredArchitecture: ["Regime-MoE"],
    requiredFeatures: ["momentum", "volatility", "breadth", "macro"],
    instructions: [
      "Choose 'Regime-MoE' (Regime-Conditioned Mixture-of-Experts) to blend experts using Project-1 regime posteriors.",
      "Enable 'Event Gating' to damp active sizing during the extreme June 4, 2024 election window.",
      "Generate the immutable SEBI Audit Log from the compliance desk.",
    ],
  },
];

// Helper to generate a deterministic series of market dates & sector prices
export function generateSectorData(): SectorDataPoint[] {
  const data: SectorDataPoint[] = [];
  const startDate = new Date(2008, 0, 1);
  const numWeeks = 960; // Covering ~18 years weekly

  // Initial pricing levels in Rs. (as proxy indices)
  const basePrices: Record<SectorIndex, number> = {
    "Nifty Bank": 8000,
    "Nifty Private Bank": 9000,
    "Nifty PSU Bank": 2500,
    "Nifty IT": 4500,
    "Nifty Auto": 3500,
    "Nifty Pharma": 3000,
    "Nifty Metal": 2000,
    "Nifty FMCG": 6000,
    "Nifty Energy": 4000,
    "Nifty Realty": 800,
    "Nifty Media": 1500,
    "Nifty Financial Services": 7500,
    "Nifty Healthcare": 5000,
    "Nifty Consumer": 3500,
  };

  const currentPrices = { ...basePrices };

  // Deterministic seedable random number generator
  let seed = 42;
  function random(): number {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function randomNormal(): number {
    const u1 = random();
    const u2 = random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  for (let i = 0; i < numWeeks; i++) {
    const currentDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split("T")[0];

    // Determine prevailing regime and scenario
    let regime: MarketRegime = "Risk-On Trending";
    let activeScenarioId = "";

    for (const sc of SCENARIOS) {
      if (dateStr >= sc.startDate && dateStr <= sc.endDate) {
        activeScenarioId = sc.id;
      }
    }

    // Dynamic macro indicators
    let usdInr = 40 + (i / numWeeks) * 44; // secular depreciation from 40 to 84
    let gilt10y = 7.0 + randomNormal() * 0.2;
    let brentCrude = 60 + random() * 40;

    // Adjust macro and regime based on historical periods
    if (activeScenarioId === "scen_taper_2013") {
      regime = "Risk-Off Dislocated";
      usdInr += 8.0; // Rapid spike
      gilt10y += 1.5; // Yield spike
    } else if (activeScenarioId === "scen_ilfs_2018") {
      regime = "Range-Bound";
      gilt10y += 0.8;
    } else if (activeScenarioId === "scen_covid_2020") {
      regime = "Risk-Off Dislocated";
      usdInr += 5.0;
      brentCrude -= 25.0; // oil crashes
    } else if (activeScenarioId === "scen_psu_2023") {
      regime = "Risk-On Trending";
      brentCrude += 15.0;
    } else if (activeScenarioId === "scen_election_2024") {
      regime = "Range-Bound"; // volatile
    } else if (usdInr > 75 && random() > 0.7) {
      regime = "Risk-Off Dislocated";
    } else if (random() > 0.8) {
      regime = "Range-Bound";
    }

    // Regime Posterior (soft assignments)
    const regimePosterior: Record<MarketRegime, number> = {
      "Risk-On Trending": 0.1,
      "Risk-Off Dislocated": 0.1,
      "Range-Bound": 0.1,
    };
    regimePosterior[regime] = 0.8;
    const remaining = 0.2;
    const otherRegimes = (Object.keys(regimePosterior) as MarketRegime[]).filter((r) => r !== regime);
    regimePosterior[otherRegimes[0]] = remaining * 0.7;
    regimePosterior[otherRegimes[1]] = remaining * 0.3;

    // Generate weekly returns with scenario-specific shifts
    const returns: Record<SectorIndex, number> = {} as any;

    for (const sector of SECTOR_INDICES) {
      let meanWeeklyReturn = 0.002; // ~10% annualised base
      let vol = 0.025; // 18% annualised

      // Base sector traits
      if (sector === "Nifty IT" || sector === "Nifty Pharma" || sector === "Nifty FMCG" || sector === "Nifty Healthcare") {
        vol = 0.02; // defensives
      } else if (sector === "Nifty Realty" || sector === "Nifty PSU Bank" || sector === "Nifty Metal" || sector === "Nifty Media") {
        vol = 0.04; // cyclicals
      }

      // 1. Taper Tantrum 2013 Shocks
      if (activeScenarioId === "scen_taper_2013") {
        if (sector === "Nifty IT" || sector === "Nifty Pharma") {
          meanWeeklyReturn = 0.008; // Rallied
        } else if (sector === "Nifty Realty" || sector === "Nifty Bank" || sector === "Nifty Private Bank" || sector === "Nifty Auto") {
          meanWeeklyReturn = -0.015; // Crashed
        }
      }
      // 2. IL&FS 2018 Shocks
      else if (activeScenarioId === "scen_ilfs_2018") {
        if (sector === "Nifty Private Bank" || sector === "Nifty Financial Services" || sector === "Nifty Realty" || sector === "Nifty Consumer") {
          meanWeeklyReturn = -0.012; // Deleveraging crash
        } else if (sector === "Nifty PSU Bank" || sector === "Nifty FMCG") {
          meanWeeklyReturn = 0.003; // Flight to safety
        }
      }
      // 3. COVID 2020 Shocks
      else if (activeScenarioId === "scen_covid_2020") {
        // Initial general crash in March/April 2020
        const isInitialCrash = dateStr >= "2020-03-01" && dateStr <= "2020-04-30";
        if (isInitialCrash) {
          meanWeeklyReturn = -0.04;
        } else {
          // Structural tech rerating thereafter
          if (sector === "Nifty IT" || sector === "Nifty Healthcare" || sector === "Nifty Pharma") {
            meanWeeklyReturn = 0.012;
          } else if (sector === "Nifty Bank" || sector === "Nifty Private Bank" || sector === "Nifty Realty") {
            meanWeeklyReturn = 0.001;
          }
        }
      }
      // 4. PSU + Capex 2023-24 Rally
      else if (activeScenarioId === "scen_psu_2023") {
        if (sector === "Nifty PSU Bank" || sector === "Nifty Metal" || sector === "Nifty Realty" || sector === "Nifty Auto") {
          meanWeeklyReturn = 0.01; // PSU Bank & industrial boom
        } else if (sector === "Nifty FMCG" || sector === "Nifty IT") {
          meanWeeklyReturn = 0.001; // Defensives lag
        }
      }
      // 5. Election 2024 Shock
      else if (activeScenarioId === "scen_election_2024") {
        const isElectionWeek = dateStr >= "2024-06-01" && dateStr <= "2024-06-08";
        if (isElectionWeek) {
          if (sector === "Nifty PSU Bank" || sector === "Nifty Metal") {
            meanWeeklyReturn = -0.09; // sharp drop
          } else if (sector === "Nifty FMCG" || sector === "Nifty Pharma") {
            meanWeeklyReturn = 0.03; // defensive flight
          }
        } else {
          // Sharp reversal week
          if (sector === "Nifty PSU Bank" || sector === "Nifty Metal") {
            meanWeeklyReturn = 0.05;
          }
        }
      }

      // General market noise
      const ret = meanWeeklyReturn + randomNormal() * vol;
      returns[sector] = ret;
      currentPrices[sector] = Math.max(10, currentPrices[sector] * (1 + ret));
    }

    // Volumes
    const volumes: Record<SectorIndex, number> = {} as any;
    for (const sector of SECTOR_INDICES) {
      const isShock = activeScenarioId !== "";
      volumes[sector] = Math.round((1000000 + random() * 500000) * (isShock ? 2.5 : 1.0));
    }

    data.push({
      date: dateStr,
      prices: { ...currentPrices },
      volumes,
      returns,
      regime,
      regimePosterior,
      macro: {
        usdInr,
        gilt10y,
        brentCrude,
      },
    });
  }

  return data;
}
