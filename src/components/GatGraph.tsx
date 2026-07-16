import React, { useState, useEffect } from "react";
import { SectorIndex, AttentionEdge } from "../types";
import { SECTOR_INDICES } from "../data";
import { ShieldCheck, Info, Cpu, Layers } from "lucide-react";

interface GatGraphProps {
  attentionEdges: AttentionEdge[];
  nodeScores: Record<SectorIndex, { score: number; uncertainty: number; conformalGated: boolean }>;
  centrality: Record<SectorIndex, { degree: number; pagerank: number }>;
  onSelectNode: (node: SectorIndex) => void;
  selectedNode: SectorIndex | null;
}

export const GatGraph: React.FC<GatGraphProps> = ({
  attentionEdges,
  nodeScores,
  centrality,
  onSelectNode,
  selectedNode,
}) => {
  const [hoveredNode, setHoveredNode] = useState<SectorIndex | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<AttentionEdge | null>(null);
  const [positions, setPositions] = useState<Record<SectorIndex, { x: number; y: number }>>({} as any);

  // Concentric double-ring layout (Inner ring = heavy weights, Outer ring = cyclical/defensive)
  useEffect(() => {
    const newPositions: Record<SectorIndex, { x: number; y: number }> = {} as any;
    const width = 600;
    const height = 480;
    const cx = width / 2;
    const cy = height / 2;

    const innerSectors: SectorIndex[] = [
      "Nifty Bank",
      "Nifty Private Bank",
      "Nifty PSU Bank",
      "Nifty Financial Services",
      "Nifty Consumer",
    ];

    const outerSectors: SectorIndex[] = SECTOR_INDICES.filter((s) => !innerSectors.includes(s));

    // Arrange inner ring (R = 110)
    innerSectors.forEach((s, idx) => {
      const angle = (idx / innerSectors.length) * 2 * Math.PI - Math.PI / 2;
      newPositions[s] = {
        x: cx + 105 * Math.cos(angle),
        y: cy + 105 * Math.sin(angle),
      };
    });

    // Arrange outer ring (R = 210)
    outerSectors.forEach((s, idx) => {
      const angle = (idx / outerSectors.length) * 2 * Math.PI - Math.PI / 4;
      newPositions[s] = {
        x: cx + 205 * Math.cos(angle),
        y: cy + 205 * Math.sin(angle),
      };
    });

    setPositions(newPositions);
  }, []);

  const handleNodeClick = (node: SectorIndex) => {
    onSelectNode(node);
  };

  const getSectorColor = (s: SectorIndex) => {
    const item = nodeScores[s];
    if (!item) return "fill-slate-100 stroke-slate-400 text-slate-600";
    if (item.conformalGated && item.uncertainty <= 0.15) {
      return "fill-emerald-100 stroke-emerald-600 text-emerald-800"; // Gated overweight
    }
    const val = item.score;
    if (val > 0.6) return "fill-emerald-50 stroke-emerald-500 text-emerald-700";
    if (val > 0.4) return "fill-slate-100 stroke-slate-500 text-slate-800";
    return "fill-rose-50 stroke-rose-400 text-rose-700";
  };

  // Find max attention weight for relative scaling
  const maxWeight = Math.max(...attentionEdges.map((e) => Math.abs(e.weight)), 0.01);

  // Filter edges connected to the selected or hovered node for visual clarity
  const activeFocus = hoveredNode || selectedNode;
  const filteredEdges = attentionEdges.filter((e) => {
    if (!activeFocus) return Math.abs(e.weight) > 0.15; // default density threshold
    return e.source === activeFocus || e.target === activeFocus;
  });

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-6">
      {/* Visual Marker Definitions for SVG Arrows */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" opacity="0.6" />
          </marker>
          <marker id="arrow-selected" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
          </marker>
        </defs>
      </svg>

      {/* Network Stage */}
      <div className="flex-1 flex justify-center items-center bg-slate-50 rounded-xl border border-slate-200 p-2 relative h-[480px]">
        {Object.keys(positions).length > 0 && (
          <svg width="100%" height="100%" viewBox="0 0 600 480" className="select-none">
            {/* Ambient Background Grid Rings */}
            <circle cx="300" cy="240" r="105" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />
            <circle cx="300" cy="240" r="205" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />

            {/* Edge Layers */}
            {filteredEdges.map((edge, idx) => {
              const start = positions[edge.source];
              const end = positions[edge.target];
              if (!start || !end) return null;

              const isHighlighted =
                selectedNode === edge.source ||
                selectedNode === edge.target ||
                hoveredNode === edge.source ||
                hoveredNode === edge.target;

              // Compute link styles
              const weightRatio = Math.min(1.0, Math.abs(edge.weight) / maxWeight);
              let strokeWidth = 1.0 + weightRatio * 4.5;
              let strokeColor = "#94a3b8";
              let strokeDash: string | undefined = undefined;

              if (edge.type) {
                // Relational Colors
                if (edge.type === "correlation") strokeColor = "#3b82f6"; // Blue
                else if (edge.type === "leads") strokeColor = "#06b6d4"; // Cyan (directed)
                else strokeColor = "#f59e0b"; // Co-flows (amber)
              } else if (edge.sign) {
                // Signed Colors
                if (edge.sign === "positive") strokeColor = "#10b981"; // Emerald
                else {
                  strokeColor = "#ef4444"; // Crimson negative
                  strokeDash = "4,4";
                }
              } else if (isHighlighted) {
                strokeColor = "#2563eb";
              }

              const opacity = isHighlighted ? 0.95 : 0.2 + weightRatio * 0.45;

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={opacity}
                    strokeDasharray={strokeDash}
                    markerEnd={edge.type === "leads" || isHighlighted ? "url(#arrow-selected)" : "url(#arrow)"}
                    className="transition-all duration-350 cursor-pointer"
                    onMouseEnter={() => setHoveredEdge(edge)}
                    onMouseLeave={() => setHoveredEdge(null)}
                  />
                  {/* Subtle edge value label for high-weight focus */}
                  {isHighlighted && Math.abs(edge.weight) > 0.25 && (
                    <text
                      x={(start.x + end.x) / 2}
                      y={(start.y + end.y) / 2 - 4}
                      fill="#475569"
                      fontSize="9"
                      fontWeight="600"
                      className="bg-white"
                      textAnchor="middle"
                    >
                      {edge.weight > 0 ? "+" : ""}{edge.weight}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Node Layer */}
            {SECTOR_INDICES.map((sector) => {
              const pos = positions[sector];
              if (!pos) return null;

              const isSelected = selectedNode === sector;
              const isHovered = hoveredNode === sector;
              const details = nodeScores[sector] || { score: 0.5, uncertainty: 0.1, conformalGated: false };

              return (
                <g
                  key={sector}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(sector)}
                  onMouseEnter={() => setHoveredNode(sector)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer selection ring */}
                  {(isSelected || isHovered) && (
                    <circle r="22" fill="none" stroke={isSelected ? "#2563eb" : "#94a3b8"} strokeWidth="2.5" className="animate-pulse" />
                  )}

                  {/* Conformal overweight overlay ring */}
                  {details.conformalGated && details.uncertainty <= 0.15 && (
                    <circle r="19" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />
                  )}

                  {/* Core Node Circle */}
                  <circle r="14" className={`${getSectorColor(sector)} transition-all duration-300 shadow-md`} strokeWidth="2" />

                  {/* Core icon / indicator */}
                  {details.conformalGated && details.uncertainty <= 0.15 ? (
                    <circle r="4" cx="0" cy="0" fill="#10b981" />
                  ) : (
                    <circle r="2" cx="0" cy="0" fill="#64748b" />
                  )}

                  {/* Node Name labels with backgrounds */}
                  <text
                    y="25"
                    textAnchor="middle"
                    fill={isSelected ? "#2563eb" : isHovered ? "#0f172a" : "#475569"}
                    fontSize="9.5"
                    fontWeight={isSelected || isHovered ? "700" : "500"}
                    className="pointer-events-none select-none drop-shadow"
                  >
                    {sector.replace("Nifty ", "")}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Ambient Overlay Legend */}
        <div className="absolute top-3 left-3 bg-white/95 border border-slate-200 rounded-lg p-2 text-[9px] text-slate-500 space-y-1 select-none pointer-events-none shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
            <span>Overweight (Gated/Conformal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 block"></span>
            <span>Neutral / Hold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 block"></span>
            <span>Underweight Target</span>
          </div>
        </div>
      </div>

      {/* Detail HUD Card */}
      <div className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between text-sm">
        {hoveredNode || selectedNode ? (
          <div>
            <div className="flex items-start justify-between border-b border-slate-200 pb-2 mb-3">
              <div>
                <h4 className="text-slate-900 font-bold text-base leading-tight">
                  {hoveredNode || selectedNode}
                </h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">NSE Sectoral Index</p>
              </div>
              {(hoveredNode || selectedNode) && nodeScores[hoveredNode || selectedNode!]?.conformalGated && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Gated
                </span>
              )}
            </div>

            {/* Model Outputs */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>GNN Raw Rank Score:</span>
                  <span className="text-slate-800 font-bold">
                    {(nodeScores[hoveredNode || selectedNode!]?.score * 100).toFixed(1)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-350"
                    style={{ width: `${Math.min(100, (nodeScores[hoveredNode || selectedNode!]?.score || 0) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block font-medium">Predictive StdDev:</span>
                  <span className={`font-bold ${nodeScores[hoveredNode || selectedNode!]?.uncertainty > 0.15 ? "text-amber-600" : "text-emerald-600"}`}>
                    {nodeScores[hoveredNode || selectedNode!]?.uncertainty?.toFixed(3)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block font-medium">GNN Centrality:</span>
                  <span className="text-slate-800 font-bold">
                    {centrality[hoveredNode || selectedNode!]?.degree?.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Edge Explanations / GNNExplainer summary */}
              <div className="border-t border-slate-200 pt-3 mt-3">
                <span className="text-[11px] text-slate-500 font-bold block mb-1">
                  💡 GNNExplainer Attribution
                </span>
                <p className="text-[11.5px] text-slate-600 leading-relaxed bg-white p-2 rounded border border-slate-200 shadow-sm font-medium">
                  {hoveredNode || selectedNode === "Nifty IT"
                    ? "IT sensitivity is conditioned heavily by USDINR momentum. Subgraph shows strong co-flows with FMCG."
                    : hoveredNode || selectedNode === "Nifty Bank" || hoveredNode || selectedNode === "Nifty Private Bank"
                    ? "Banking cluster is the central core network hub, heavily leading Realty and Financial Services."
                    : hoveredNode || selectedNode === "Nifty PSU Bank"
                    ? "PSU Bank is showing high asymmetric attention from infrastructure/Capex indices in the current regime."
                    : "Attention links demonstrate robust regime-conditioned sparsity with low over-smoothing."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-6">
            <Layers className="w-8 h-8 text-slate-450 mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-slate-500">Select or hover over any index node to inspect features, centralities, and GNNExplainer attention links.</p>
          </div>
        )}

        <div className="border-t border-slate-200 pt-3 mt-4 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center gap-1 font-medium">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Click node to set as Explainer Target</span>
          </div>
          <p className="font-medium text-slate-400">Inner ring contains systemically heavy financial nodes. Outer ring contains defensive & commodities.</p>
        </div>
      </div>
    </div>
  );
};
