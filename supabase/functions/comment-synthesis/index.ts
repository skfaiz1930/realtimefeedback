import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders } from "../_shared/cors.ts";


interface CommentLite {
  text: string;
  sent: "pos" | "neu" | "neg";
  dim: string;
  theme: string;
  department: string;
  managerName?: string;
  respondent: string;
  ageGroup: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { comments, period, filters, scope, managerName } = await req.json() as {
      comments: CommentLite[];
      period: string;
      filters?: Record<string, string>;
      scope: "org" | "manager";
      managerName?: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    if (!Array.isArray(comments) || comments.length === 0) {
      return new Response(JSON.stringify({ error: "No comments provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim to keep prompt small
    const trimmed = comments.slice(0, 200).map(c => ({
      t: c.text, s: c.sent, d: c.dim, th: c.theme,
      dept: c.department, r: c.respondent, age: c.ageGroup,
    }));

    const system = `You are an expert HR qualitative analyst at Great Manager Institute. You read employee feedback comments and synthesise them into exactly 3 specific, named, actionable insights for an HR Head.
Rules:
- Each bullet must reference specific data: department names, comment counts, score numbers, or verbatim phrases employees used.
- Never be generic. "Communication needs improvement" is unacceptable. "Sales managers are not closing growth conversations — 14 comments use the phrase nothing changed" is acceptable.
- Bullet 3 (doTomorrow) must be a specific action with a named target: a person, team, department, or question to ask.
- Tone: direct, clear, zero corporate language. Each bullet 1-3 sentences.`;

    const filterStr = filters && Object.keys(filters).length
      ? Object.entries(filters).map(([k, v]) => `${k}=${v}`).join(", ")
      : "none";

    const userPrompt = scope === "manager"
      ? `Synthesise these ${trimmed.length} employee comments from ${period}.
Filter: Comments from manager ${managerName}'s team only.
Focus the synthesis on what THIS specific manager's team is saying — not org-wide patterns.
The doTomorrow bullet must start with: "Address this directly with ${managerName}: ".

Comments JSON: ${JSON.stringify(trimmed)}`
      : `Synthesise these ${trimmed.length} employee comments from ${period}.
Active filters: ${filterStr}

Comments JSON: ${JSON.stringify(trimmed)}`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_synthesis",
            description: "Return the 3-bullet synthesis.",
            parameters: {
              type: "object",
              properties: {
                doingWell: { type: "string" },
                hurting: { type: "string" },
                doTomorrow: { type: "string" },
                commentCount: { type: "number" },
                topDepartmentMentioned: { type: "string" },
                topThemeMentioned: { type: "string" },
              },
              required: ["doingWell", "hurting", "doTomorrow", "commentCount", "topDepartmentMentioned", "topThemeMentioned"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_synthesis" } },
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
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify({ error: "No synthesis returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(args);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("comment-synthesis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
