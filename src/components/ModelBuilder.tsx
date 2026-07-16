import React from "react";
import { ModelConfig, CampaignLevel } from "../types";
import { Play, RotateCcw, AlertCircle, Info, Settings, HelpCircle } from "lucide-react";

interface ModelBuilderProps {
  config: ModelConfig;
  onChangeConfig: (newConfig: ModelConfig) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
  activeLevel: CampaignLevel;
}

export const ModelBuilder: React.FC<ModelBuilderProps> = ({
  config,
  onChangeConfig,
  onRunBacktest,
  isRunning,
  activeLevel,
}) => {
  const toggleFeature = (family: string) => {
    const next = [...config.features];
    if (next.includes(family)) {
      if (next.length > 1) {
        onChangeConfig({ ...config, features: next.filter((f) => f !== family) });
      }
    } else {
      onChangeConfig({ ...config, features: [...next, family] });
    }
  };

  // Check if current config meets level constraints
  const hasRequiredArch = activeLevel.requiredArchitecture.includes(config.architecture);
  const missingFeatures = activeLevel.requiredFeatures.filter((f) => !config.features.includes(f));
  const isEligible = hasRequiredArch && missingFeatures.length === 0;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6 flex flex-col justify-between h-full">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="text-slate-900 font-bold text-base">Model Engineering Lab</h3>
          </div>
          <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-500">
            Level {activeLevel.level} Locked Target
          </span>
        </div>

        {/* 1. GNN Architecture Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
            1. GNN Model Architecture
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(["GCN", "GAT", "GATv2", "TGAT", "Relational GAT", "Signed GAT", "Regime-MoE"] as const).map((arch) => (
              <button
                key={arch}
                onClick={() => onChangeConfig({ ...config, architecture: arch })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold text-left border transition-all duration-200 ${
                  config.architecture === arch
                    ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {arch}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Feature Families Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
              2. Node Feature Families
            </label>
            <span className="text-[10px] text-slate-400 font-medium">At least 1 required</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "momentum", label: "Momentum & Trend", desc: "63d Relative Strength" },
              { id: "volatility", label: "Volatility & Risk", desc: "Standard Dev & Beta" },
              { id: "breadth", label: "Breadth & Participation", desc: "Volume ratios" },
              { id: "macro", label: "Macro Sensitivity", desc: "USDINR, Gilt & Brent betas" },
            ].map((feat) => {
              const isSelected = config.features.includes(feat.id);
              return (
                <button
                  key={feat.id}
                  onClick={() => toggleFeature(feat.id)}
                  className={`py-2 px-3 rounded-lg border text-left transition-all duration-200 ${
                    isSelected
                      ? "bg-blue-50/50 border-blue-300 text-slate-800 font-medium shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <span className="text-xs font-bold block">{feat.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{feat.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Adjacency Options */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
            3. Dynamic Edge Definition
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "correlation", label: "Pearson Corr" },
              { id: "partial_correlation", label: "Partial Corr" },
              { id: "mutual_info", label: "Mutual Info" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onChangeConfig({ ...config, adjacencyMethod: m.id as any })}
                className={`py-1.5 rounded-md text-[11px] font-bold border text-center transition-all ${
                  config.adjacencyMethod === m.id
                    ? "bg-white border-slate-350 text-slate-800 shadow-sm"
                    : "bg-slate-100/50 border-slate-200 text-slate-400 hover:text-slate-600"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Sparsity Threshold Filter:</span>
              <span className="text-slate-800 font-bold">{config.adjacencyThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={config.adjacencyThreshold}
              onChange={(e) => onChangeConfig({ ...config, adjacencyThreshold: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-1.5"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={config.addFullConnectivity}
              onChange={(e) => onChangeConfig({ ...config, addFullConnectivity: e.target.checked })}
              className="rounded accent-blue-600 border-slate-300 bg-white"
            />
            <span className="text-[11px] text-slate-500 font-medium">Add fully-connected weak connectivity prior (0.05)</span>
          </label>
        </div>

        {/* 4. Conformal & Uncertainty Gating */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">Conformal Alpha (α) <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></span>
              <span className="text-slate-800 font-bold">{config.conformalAlpha}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.05"
              value={config.conformalAlpha}
              onChange={(e) => onChangeConfig({ ...config, conformalAlpha: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-1"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>MC Dropout Samples:</span>
              <span className="text-slate-800 font-bold">{config.mcSamples}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={config.mcSamples}
              onChange={(e) => onChangeConfig({ ...config, mcSamples: parseInt(e.target.value) })}
              className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-1"
            />
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Event-Window Confidence Gating</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.eventGating}
                onChange={(e) => onChangeConfig({ ...config, eventGating: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Verification alerts & Actions */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        {!isEligible && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-normal">
              <p className="font-bold">Missing Level Requirements:</p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1 font-medium">
                {!hasRequiredArch && (
                  <li>Requires architecture: {activeLevel.requiredArchitecture.join(" or ")}</li>
                )}
                {missingFeatures.length > 0 && (
                  <li>Requires features: {missingFeatures.map((f) => `'${f}'`).join(", ")}</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {isEligible && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">All model parameter parameters comply with Level {activeLevel.level} criteria!</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() =>
              onChangeConfig({
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
              })
            }
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition shadow-sm"
            title="Reset model configuration to defaults"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={onRunBacktest}
            disabled={isRunning}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition duration-200 shadow-md ${
              isRunning
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.01]"
            }`}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-300 border-t-blue-600 rounded-full block"></span>
                <span>Optimising GNN Edges...</span>
              </span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Compile & Run Backtest</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
