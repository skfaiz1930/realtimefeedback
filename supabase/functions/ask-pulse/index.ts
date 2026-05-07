import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders } from "../_shared/cors.ts";


const tool = {
  type: "function",
  function: {
    name: "navigate_dashboard",
    description: "Return navigation + filter instructions for the GMI Pulse dashboard.",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: ["/", "/heatmap", "/demographics", "/trends", "/comments", "/culture-map"],
          description: "Route to navigate to. '/' is the Overview/Managers page.",
        },
        filters: {
          type: "object",
          properties: {
            dimension:      { type: "string", enum: ["Connect", "Develop", "Inspire"] },
            department:     { type: "string", enum: ["Engineering", "Sales", "Product", "Operations", "HR", "Finance"] },
            level:          { type: "string", enum: ["IC", "TeamLead", "Manager", "SrManager"] },
            tenure:         { type: "string", enum: ["0-1yr", "1-3yr", "3-5yr", "5yr+"] },
            respondentType: { type: "string", enum: ["self", "team", "peer", "rm"] },
            period:         { type: "string" },
          },
          additionalProperties: false,
        },
        sortBy: {
          type: "string",
          enum: ["score_asc", "score_desc", "delta_asc", "delta_desc"],
        },
        highlightElement: { type: "string", description: "CSS selector or short description, optional" },
        confirmationMessage: {
          type: "string",
          description: "One friendly sentence describing what is being done.",
        },
      },
      required: ["page", "confirmationMessage"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const system = `You are a navigation and filter assistant for the GMI Pulse HR analytics dashboard.

Pages:
- "/" → Overview & Managers list (use this for any manager-related query, flight risk, decliners, top performers, manager rankings)
- "/heatmap" → Question-level heatmap by respondent type (Self, Team, Peer, RM)
- "/demographics" → Score breakdown by Department, Level, Tenure, Gender
- "/trends" → Score trends over cycles (line chart, year-on-year comparison)
- "/comments" → Open-text feedback themes & quotes
- "/culture-map" → 2x2 scatter of manager Self vs Team perception

Available filters (only include those clearly implied):
- dimension: Connect | Develop | Inspire
- department: Engineering | Sales | Product | Operations | HR | Finance
- level: IC | TeamLead | Manager | SrManager
- tenure: 0-1yr | 1-3yr | 3-5yr | 5yr+
- respondentType: self | team | peer | rm
- period: cycle label (e.g. "Apr 2026 Cycle")
- sortBy: score_asc | score_desc | delta_asc | delta_desc

Always call the navigate_dashboard tool. The confirmationMessage should be one short, friendly sentence in plain English describing what you're doing (e.g. "Showing managers who declined most this cycle, sorted by biggest drop.").`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: query },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "navigate_dashboard" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "No tool call returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let args: unknown;
    try { args = JSON.parse(call.function.arguments); }
    catch {
      return new Response(JSON.stringify({ error: "Failed to parse tool arguments" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ask-pulse error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
