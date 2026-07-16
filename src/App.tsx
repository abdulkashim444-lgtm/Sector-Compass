import { useState, useEffect } from "react";
import { generateSectorData, SCENARIOS, CAM_LEVELS, SECTOR_INDICES } from "./data";
import { runGnnSimulation } from "./gnnSim";
import { ModelConfig, BacktestMetrics, CampaignLevel, SectorIndex, AttentionEdge } from "./types";
import { GatGraph } from "./components/GatGraph";
import { ModelBuilder } from "./components/ModelBuilder";
import { BacktestCharts } from "./components/BacktestCharts";
import {
  Award,
  Layers,
  Cpu,
  ShieldAlert,
  Terminal,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Play,
  Bookmark,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function App() {
  // Pre-generate historical sectoral indices data
  const [allData] = useState(() => generateSectorData());

  // Active play mode: "campaign" (Levels 1-8) or "sandbox" (arbitrary scenario testing)
  const [activeTab, setActiveTab] = useState<"campaign" | "sandbox">("campaign");

  // State for campaign levels
  const [levelIdx, setLevelIdx] = useState(0);
  const [points, setPoints] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  // Active Sandbox Scenario selection
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);

  // Model Lab Configuration State
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    architecture: "GCN",
    layers: 2,
    heads: 4,
    features: ["momentum"],
    adjacencyMethod: "correlation",
    adjacencyThreshold: 0.4,
    addFullConnectivity: false,
    mcSamples: 50,
    conformalAlpha: 0.1,
    eventGating: false,
    dropEdgeRate: 0.2,
    weightDecay: 0.0001,
  });

  // Active Pinned Node for GNNExplainer/Ablation HUD
  const [selectedNode, setSelectedNode] = useState<SectorIndex | null>("Nifty PSU Bank");

  // Ablated incoming edge state for counterfactual testing
  const [ablatedEdge, setAblatedEdge] = useState<AttentionEdge | null>(null);

  // Simulation outcome states
  const [simulationResult, setSimulationResult] = useState<ReturnType<typeof runGnnSimulation> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showLevelSuccess, setShowLevelSuccess] = useState(false);

  // CIO Coach Mode state
  const [cioReview, setCioReview] = useState<string>("");
  const [analystNotes, setAnalystNotes] = useState<string>("");
  const [isRequestingCio, setIsRequestingCio] = useState(false);

  // SEBI Compliance state
  const [sebiAudit, setSebiAudit] = useState<string>("");
  const [isRequestingAudit, setIsRequestingAudit] = useState(false);

  const activeLevel = CAM_LEVELS[levelIdx];
  const activeScenario = TabScenario();

  function TabScenario() {
    if (activeTab === "campaign") {
      return SCENARIOS.find((sc) => sc.id === activeLevel.scenarioId) || SCENARIOS[0];
    }
    return SCENARIOS[selectedScenarioIdx];
  }

  // Pre-load default simulation on startup
  useEffect(() => {
    handleRunSimulation(true);
  }, [levelIdx, activeTab, selectedScenarioIdx]);

  // Main backtest run handler
  const handleRunSimulation = (isFirstLoad = false) => {
    setIsRunning(true);
    setCioReview(""); // Reset reports
    setSebiAudit("");
    setAblatedEdge(null);

    // Simulate 2s compiler loading for GNN edge optimisation feeling
    setTimeout(() => {
      const dates = { startDate: activeScenario.startDate, endDate: activeScenario.endDate };
      const outcome = runGnnSimulation(allData, modelConfig, activeScenario.id, dates);

      setSimulationResult(outcome);
      setIsRunning(false);

      if (!isFirstLoad && activeTab === "campaign") {
        // Validate level completion parameters
        const hasArch = activeLevel.requiredArchitecture.includes(modelConfig.architecture);
        const hasFeatures = activeLevel.requiredFeatures.every((f) => modelConfig.features.includes(f));
        const meetsIc = outcome.metrics.meanIc >= activeLevel.minIc;
        const meetsIr = outcome.metrics.ir >= activeLevel.minIr;

        if (hasArch && hasFeatures && meetsIc && meetsIr) {
          setShowLevelSuccess(true);
          if (!completedLevels.includes(activeLevel.level)) {
            setCompletedLevels([...completedLevels, activeLevel.level]);
            setPoints((prev) => prev + 150);
          }
        }
      }
    }, 1200);
  };

  // Perform counterfactual edge ablation
  const handleAblateEdge = (edge: AttentionEdge) => {
    if (ablatedEdge && ablatedEdge.source === edge.source && ablatedEdge.target === edge.target) {
      // Un-ablate
      setAblatedEdge(null);
      handleRunSimulation();
    } else {
      setAblatedEdge(edge);
      // Recalculate simulation with ablated parameters (slight scoring drop on ablated node)
      if (simulationResult) {
        const currentScores = { ...simulationResult.nodeScores };
        const tgt = edge.target;
        if (currentScores[tgt]) {
          const impact = Math.abs(edge.weight) * 0.45;
          currentScores[tgt] = {
            ...currentScores[tgt],
            score: Math.max(0.01, currentScores[tgt].score - impact),
          };
          setSimulationResult({
            ...simulationResult,
            nodeScores: currentScores,
          });
        }
      }
    }
  };

  // Request AI Chief Investment Officer review
  const handleRequestCioReview = async () => {
    if (!simulationResult) return;
    setIsRequestingCio(true);
    try {
      const response = await fetch("/api/coach-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: activeLevel.level,
          scenario: activeScenario.name,
          modelConfig,
          metrics: simulationResult.metrics,
          notes: analystNotes,
        }),
      });
      const data = await response.json();
      setCioReview(data.review);
    } catch (err) {
      console.error(err);
      setCioReview("Error compiling CIO review. Ensure GEMINI_API_KEY is configured in Secrets.");
    } finally {
      setIsRequestingCio(false);
    }
  };

  // Generate SEBI regulatory compliance audit lineage
  const handleRequestSebiAudit = async () => {
    if (!simulationResult) return;
    setIsRequestingAudit(true);
    try {
      const response = await fetch("/api/audit-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: activeLevel.level,
          scenario: activeScenario.name,
          modelConfig,
          metrics: simulationResult.metrics,
        }),
      });
      const data = await response.json();
      setSebiAudit(data.auditLineage);
    } catch (err) {
      console.error(err);
      setSebiAudit("Audit compilation failed. Ensure server dev environment is fully active.");
    } finally {
      setIsRequestingAudit(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* Top Navigation Terminal Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg shadow-md shadow-blue-500/10">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-blue-600 tracking-widest font-black uppercase">Quant AMC Desk</span>
              <h1 className="text-slate-900 font-black text-sm tracking-tight">Sector Compass</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Play modes tabs */}
            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex">
              <button
                onClick={() => {
                  setActiveTab("campaign");
                  setShowLevelSuccess(false);
                }}
                className={`px-3 py-1 text-xs font-bold rounded ${
                  activeTab === "campaign"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Campaign Mode
              </button>
              <button
                onClick={() => {
                  setActiveTab("sandbox");
                  setShowLevelSuccess(false);
                }}
                className={`px-3 py-1 text-xs font-bold rounded ${
                  activeTab === "sandbox"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sandbox Mode
              </button>
            </div>

            {/* Score points counter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-sm">
              <Award className="w-4 h-4 text-emerald-600" />
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block leading-none font-bold uppercase">Analytics Score</span>
                <span className="font-mono text-sm font-black text-emerald-600 leading-none">{points} PTS</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        
        {/* Level Progression Indicator Grid (Only visible in Campaign Mode) */}
        {activeTab === "campaign" && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between overflow-x-auto gap-2 select-none shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2">Progress:</span>
            {CAM_LEVELS.map((lev, idx) => {
              const isCurrent = levelIdx === idx;
              const isDone = completedLevels.includes(lev.level);
              return (
                <button
                  key={lev.level}
                  onClick={() => {
                    setLevelIdx(idx);
                    setShowLevelSuccess(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition whitespace-nowrap ${
                    isCurrent
                      ? "bg-blue-50 border-blue-400 text-blue-750"
                      : isDone
                      ? "bg-emerald-50 border-emerald-250 text-emerald-600"
                      : "bg-slate-50 border-slate-100 text-slate-505 hover:text-slate-850 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${isDone ? "text-emerald-600 fill-emerald-100" : "text-transparent"}`} />
                  <span>Level {lev.level}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Dynamic Sandbox Selector (Only visible in Sandbox Mode) */}
        {activeTab === "sandbox" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div>
              <span className="font-mono text-[10px] text-blue-600 tracking-wider font-bold block uppercase">Sandbox Selector</span>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Select any historical Indian market regime to backtest models with zero level constraints.</p>
            </div>
            <select
              value={selectedScenarioIdx}
              onChange={(e) => setSelectedScenarioIdx(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500"
            >
              {SCENARIOS.map((sc, idx) => (
                <option key={sc.id} value={idx}>
                  {sc.name} ({sc.trigger.substring(0, 30)}...)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Celebratory Level Unlock Banner */}
        {showLevelSuccess && activeTab === "campaign" && (
          <div className="bg-emerald-50/85 border border-emerald-250 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl animate-fade-in">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="p-3 bg-emerald-500 rounded-full text-white shadow-md shadow-emerald-500/20">
                <CheckCircle className="w-8 h-8 fill-emerald-600" />
              </div>
              <div>
                <h2 className="text-slate-900 text-lg font-black tracking-tight">Level {activeLevel.level} Objective Met!</h2>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  Information Coefficient & Information Ratio achieved. Unlocked +150 Points!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowLevelSuccess(false);
                if (levelIdx < CAM_LEVELS.length - 1) {
                  setLevelIdx((prev) => prev + 1);
                }
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200"
            >
              <span>Progress to Level {activeLevel.level + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Level Objective Sheet */}
        {activeTab === "campaign" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row gap-6 justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-blue-600 fill-blue-50" />
                  <span className="font-mono text-xs text-blue-600 font-black tracking-wide uppercase">Active Campaign Objective</span>
                </div>
                <h2 className="text-slate-900 font-black text-xl leading-tight">
                  Level {activeLevel.level}: {activeLevel.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold bg-slate-50 p-3 rounded-lg border border-slate-100 max-w-3xl">
                  {activeLevel.objective}
                </p>
              </div>

              {/* Requirement Check Ledger */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:w-80 shrink-0 space-y-2.5 text-xs shadow-sm">
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Verification Target Metrics</span>
                <div className="flex justify-between border-b border-slate-150 pb-1.5 font-semibold">
                  <span className="text-slate-500">Target GNN Architecture:</span>
                  <span className="text-blue-600 font-bold">{activeLevel.requiredArchitecture.join(" or ")}</span>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-1.5 font-semibold">
                  <span className="text-slate-500">Min. Information Coeff (IC):</span>
                  <span className="text-slate-800 font-black">+{activeLevel.minIc?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Min. Information Ratio (IR):</span>
                  <span className="text-slate-800 font-black">+{activeLevel.minIr?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Sub-steps */}
            <div className="mt-4 pt-4 border-t border-slate-150">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-2">Instructions Desk</span>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600 font-semibold">
                {activeLevel.instructions.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Backtest & Layout Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Model Engineering Lab */}
          <div className="lg:col-span-1">
            <ModelBuilder
              config={modelConfig}
              onChangeConfig={setModelConfig}
              onRunBacktest={handleRunSimulation}
              isRunning={isRunning}
              activeLevel={activeLevel}
            />
          </div>

          {/* Column 2: GAT Attention Network Visualizer */}
          <div className="lg:col-span-2 space-y-6">
            <GatGraph
              attentionEdges={simulationResult?.attentionEdges || []}
              nodeScores={simulationResult?.nodeScores || ({} as any)}
              centrality={simulationResult?.centrality || ({} as any)}
              onSelectNode={setSelectedNode}
              selectedNode={selectedNode}
            />
          </div>
        </div>

        {/* Counterfactual Edge Ablation HUD */}
        {selectedNode && simulationResult && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-slate-900 font-bold text-sm">GNN Counterfactual Edge Ablation HUD</h3>
                <p className="text-[10px] text-slate-505 mt-0.5">Section A6.4: Remove connection paths to quantify absolute out-of-sample impact on target node scores.</p>
              </div>
            </div>

            {/* Edge list */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-700">
                Incoming Connection Channels to <span className="text-blue-600 font-bold">{selectedNode}</span>:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {simulationResult.attentionEdges
                  .filter((edge) => edge.target === selectedNode && Math.abs(edge.weight) > 0.05)
                  .slice(0, 6)
                  .map((edge, idx) => {
                    const isAblated = ablatedEdge && ablatedEdge.source === edge.source && ablatedEdge.target === edge.target;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleAblateEdge(edge)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between shadow-sm ${
                          isAblated
                            ? "bg-rose-50 border-rose-400 text-rose-700"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-medium"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-bold block">{edge.source.replace("Nifty ", "")} ➔ {edge.target.replace("Nifty ", "")}</span>
                          <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded font-bold border border-slate-200 shadow-sm">
                            W: {edge.weight}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-3 border-t border-slate-150 pt-2 text-[10px]">
                          <span className="text-slate-500 font-bold">{edge.type ? `Relational: ${edge.type}` : edge.sign ? `Signed: ${edge.sign}` : "Attention Edge"}</span>
                          <span className={`font-bold ${isAblated ? "text-rose-600" : "text-blue-600"}`}>
                            {isAblated ? "Ablated (Restore)" : "Click to Ablate"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Results Terminal Charts */}
        {simulationResult && (
          <BacktestCharts
            metrics={simulationResult.metrics}
            equityCurve={simulationResult.equityCurve}
            activeScenarioName={activeScenario.name}
          />
        )}

        {/* Section 3: full full-stack workspace tools (SEBI Compliance Audit & AI CIO reviews) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CIO Coach Mode */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Terminal className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-slate-900 font-bold text-sm">CIO Coach Audit Room</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Section B1.3: Ask Senior Equity Strategy Head CIO to audit and grade your active model setup.</p>
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  placeholder="Enter analyst justification notes here (e.g., 'Selected GATv2 and Partial Correlation to filter out secondary sector noise during IL&FS decoupling...')"
                  className="w-full h-24 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 font-medium"
                ></textarea>
                
                <button
                  onClick={handleRequestCioReview}
                  disabled={isRequestingCio || isRunning}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-750 text-xs font-bold rounded-xl transition duration-150 shadow-sm"
                >
                  {isRequestingCio ? (
                    <span className="animate-pulse">Consulting CIO desk...</span>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span>Request AI CIO Critique & Grade</span>
                    </>
                  )}
                </button>
              </div>

              {cioReview && (
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl max-h-72 overflow-y-auto text-xs font-semibold leading-relaxed font-sans text-slate-700 shadow-inner">
                  <div className="prose prose-xs">
                    {cioReview.split("\n").map((line, i) => (
                      <p key={i} className="mb-2">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEBI Compliance Desk */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-slate-900 font-bold text-sm">SEBI Compliance Desk</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Section A17.5: Generate immutable, auditable post-trade attention weight lineage reports.</p>
                </div>
              </div>

              <div className="bg-emerald-50/55 border border-emerald-100 rounded-xl p-4 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-normal">
                  <p className="font-bold text-slate-800">SEBI Auditable Guarantee:</p>
                  <p className="text-slate-600 mt-1 font-semibold">
                    Ensures every individual sector-tilt decision features documented timestamp, model version, exact attention weight channels, and conformal calibration sets to survive regulatory scrutiny.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRequestSebiAudit}
                disabled={isRequestingAudit || isRunning}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-750 text-xs font-bold rounded-xl transition duration-150 shadow-sm"
              >
                {isRequestingAudit ? (
                  <span className="animate-pulse">Assembling audit trails...</span>
                ) : (
                  <>
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Generate Immutable SEBI Audit Log</span>
                  </>
                )}
              </button>

              {sebiAudit && (
                <div className="bg-emerald-50/20 p-4 border border-emerald-100 rounded-xl max-h-72 overflow-y-auto text-xs leading-relaxed font-mono text-emerald-800 shadow-inner">
                  <pre className="whitespace-pre-wrap">{sebiAudit}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono shadow-inner">
        <div className="max-w-7xl mx-auto px-6">
          <span>Strictly Private and Confidential · Zetheta Algorithms Private Limited · CIN: U62012MH2023PTC410415</span>
        </div>
      </footer>
    </div>
  );
}
