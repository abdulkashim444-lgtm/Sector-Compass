import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization of Gemini client for robust safety
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// CIO Coach Mode Review Route
app.post("/api/coach-review", async (req, res) => {
  try {
    const { level, scenario, modelConfig, metrics, notes } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // High-fidelity fallback for offline or unconfigured API keys
      return res.json({
        review: `### 🏢 CIO Audit Desk: Offline Mode Active
**Persona:** Senior Equity Strategy Head (CIO)
**Feedback:**
The system is running with simulated feedback. Your current model configuration for **Level ${level} (${scenario})** looks interesting.
- **Features selected:** ${modelConfig.features?.join(", ") || "None"}
- **Architecture:** ${modelConfig.architecture}
- **Adjacency Method:** ${modelConfig.adjacencyMethod}

*CIO Insights:*
1. Under the **${scenario}** regime, your chosen architecture (${modelConfig.architecture}) yields an Information Ratio of **${metrics.ir?.toFixed(2) || "N/A"}** and CAGR of **${metrics.cagr?.toFixed(1) || "N/A"}%**.
2. Be mindful of **over-smoothing** with deep GNNs. Ensure your regularisation parameters (like DropEdge or Dropout) are set appropriately to prevent attention-weight collapse.
3. Your tracking error stands at **${metrics.trackingError?.toFixed(2) || "N/A"}%**. For a long-only scheme, ensure this aligns with your scheme information document constraints before submitting to the Investment Committee.
4. *To enable premium AI-powered CIO critiques, configure your **GEMINI_API_KEY** in the Secrets panel.*`,
      });
    }

    const prompt = `You are a brilliant, veteran Chief Investment Officer (CIO) and Senior Equity Strategy Head at a Tier 1 Indian Asset Management Company (AMC).
Your job is to audit, critique, and grade a Data Quantitative Analyst's sector-rotation model design.
Write in an authoritative, highly professional, sharp buy-side tone. Use Indian mutual-fund industry terminology (e.g., 'SEBI regulations', 'active returns', 'sector overlays', 'long-only schemes', 'information ratio', 'tracking error', 'reconstitution jumps', 'transaction drag').
Be constructive, rigorous, and extremely detailed. Do not use generic filler words or empty praise. Point out technical flaws, and explain how the selected graph neural network options impact risk and return in the specified scenario.

--- Context ---
Campaign Level: Level ${level}
Scenario / Regime: ${scenario}
Model Architecture: ${modelConfig.architecture} (Layers: ${modelConfig.layers || 2}, Heads: ${modelConfig.heads || 4})
Selected Sector Features: ${modelConfig.features?.join(", ") || "None"}
Adjacency Base Method: ${modelConfig.adjacencyMethod} (Threshold: ${modelConfig.adjacencyThreshold || 0.4})
Uncertainty / Conformal Settings: MC Samples: ${modelConfig.mcSamples || 50}, Conformal Alpha: ${modelConfig.conformalAlpha || 0.1}, Event Gating: ${modelConfig.eventGating ? "Enabled" : "Disabled"}
Regularisation Stack: DropEdge Rate: ${modelConfig.dropEdgeRate || 0.2}, Weight Decay: ${modelConfig.weightDecay || "1e-4"}

--- Backtest Metrics ---
Total Return: ${metrics.totalReturn?.toFixed(1)}% (vs Benchmark Passive: ${metrics.benchReturn?.toFixed(1)}%)
CAGR: ${metrics.cagr?.toFixed(1)}%
Annualised Volatility: ${metrics.volatility?.toFixed(1)}%
Information Ratio (IR): ${metrics.ir?.toFixed(2)}
Tracking Error: ${metrics.trackingError?.toFixed(2)}%
Hit Rate: ${(metrics.hitRate * 100)?.toFixed(1)}%
Max Drawdown: ${metrics.maxDrawdown?.toFixed(1)}%
Model Information Coefficient (IC): ${metrics.meanIc?.toFixed(3)}
ICIR (Information Ratio of IC): ${metrics.icir?.toFixed(3)}

--- Analyst Submission Notes ---
"${notes || "No custom notes submitted."}"

--- Output Guidelines ---
- Start with a clear grade (e.g., **GRADE: PASS (EXCELLENT)**, **GRADE: REVIEW REQUIRED**, **GRADE: FAIL (EXCESSIVE RISK)**).
- Divide your audit review into three logical sections:
  1. **Aesthetic & Theoretical Architecture Audit**: Critique the choice of GNN variant (${modelConfig.architecture}) and node features in relation to the ${scenario} scenario.
  2. **Risk & Regulatory Compliance Assessment**: Analyse the tracking error, drawdown, and whether the conformal confidence bounds protect the long-only scheme from severe drawdowns. Critique the SEBI-auditable quality.
  3. **Strategic Trading Desk Directives**: Provide 3 clear actionable directives to refine or size the sector tilts.
- Keep the response around 350-450 words, formatted in beautiful, clean Markdown. No emojis unless highly functional. Do not output code.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ review: response.text });
  } catch (error: any) {
    console.error("CIO Review API Error:", error);
    res.status(500).json({ error: "Failed to generate CIO Review. " + error.message });
  }
});

// SEBI Audit Explain Route
app.post("/api/audit-explain", async (req, res) => {
  try {
    const { level, scenario, modelConfig, metrics } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        auditLineage: `### 📄 NSE Sector Adjacency & Attention Lineage Report
**SEBI Compliance Checklist ID:** SCR-GNN-2026-T1
**Status:** Generated (Simulated Engine)

**1. Model Version Verification:**
- Engine ID: ${modelConfig.architecture}_v${level}.0
- Parameter Checksum: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}

**2. Focus Attention Weights Audit:**
In the **${scenario}** scenario, the highest recorded attention weight transitions were:
- **Nifty Private Bank ➔ Nifty PSU Bank**: 0.284 (High-conviction integration)
- **Nifty IT ➔ Nifty FMCG**: 0.187 (Safety-flight flight channel)
- **Nifty Realty ➔ Nifty Bank**: 0.084 (Deleveraged)

**3. Conformal Coverage Guarantee:**
- Calibrated score threshold: **-0.142**
- At Conformal Alpha = ${modelConfig.conformalAlpha || 0.1}, the truly outperforming sectors are guaranteed to be contained in the candidate set with 90% confidence.
- Current Gated Overlay Overweights: **Nifty IT**, **Nifty PSU Bank**, **Nifty Realty**.

*Configure your GEMINI_API_KEY in Secrets for detailed, deep generative audit write-ups.*`,
      });
    }

    const prompt = `You are a Lead Financial Model Validator and Compliance Officer at a Tier 1 Indian Asset Management Company (AMC).
Your job is to generate a formal, SEBI-inspector-auditable **Attention-Weight Lineage and Risk Attribution Report** for a Temporal Graph Sector Rotation Network in the **${scenario}** scenario.

--- Configuration ---
Model: ${modelConfig.architecture}
Adjacency: ${modelConfig.adjacencyMethod} (Threshold: ${modelConfig.adjacencyThreshold})
Selected Features: ${modelConfig.features?.join(", ")}
Metrics: CAGR: ${metrics.cagr?.toFixed(1)}%, IR: ${metrics.ir?.toFixed(2)}, Tracking Error: ${metrics.trackingError?.toFixed(2)}%

Provide a highly formal compliance write-up that satisfies the following:
1. **Model Audit Hash**: State a simulated version ID, model check code, and date.
2. **Attention Edge-Level Lineage**: Describe how the attention weights (e.g., from Private Banks to NBFCs, or IT to FMCG/Pharma) shift dynamically during the ${scenario}. Provide concrete simulated weights (e.g. 'collapsing from 0.85 to 0.12', or 'gaining 0.35 attention score'). Highlight if the network behaves as asymmetric and directed.
3. **Conformal Coverage Bounds & Epistemic Uncertainty**: Explain how the MC-dropout standard deviations and split-conformal top-k sets were used to gate the active sector-tilt weights, ensuring compliance with mutual fund long-only tracking error rules.
4. **Audit Verdict**: Provide an official validation seal of compliance (e.g., SEBI FORM-8 AUDIT-DEFENSIBLE VERDICT: APPROVED).

Use professional compliance language. Avoid any casual tone. Format in beautiful, clean Markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ auditLineage: response.text });
  } catch (error: any) {
    console.error("Audit Explain API Error:", error);
    res.status(500).json({ error: "Failed to generate Audit Lineage. " + error.message });
  }
});

// Setup Vite Dev Server / Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
