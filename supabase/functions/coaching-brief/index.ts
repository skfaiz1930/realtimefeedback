import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders } from "../_shared/cors.ts";


Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { manager, commentThemes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const system =
      "You are an executive coach writing a 1-page coaching brief for an HR Head about a people-manager. " +
      "Use clear markdown with these EXACT sections in this order, each as a level-3 heading (###):\n" +
      "### Snapshot\n### What Employees Are Saying\n### Strengths\n### Blind Spots\n### 3 Coaching Prompts\n### Suggested 1:1 Agenda\n\n" +
      "What Employees Are Saying: 2-3 short bullets pulling from provided comment themes; quote sparingly. " +
      "Strengths and Blind Spots: 2-3 short bullets each, ground them in the comment themes when relevant. " +
      "Coaching Prompts: numbered list of 3 specific, open-ended questions. " +
      "1:1 Agenda: 4-5 bulleted timed items. Total length under 320 words. No preamble.";

    const riskNarrative =
      manager.risk === "at-risk"
        ? "This manager is in the at-risk band — likely flight risk on their team. Be direct."
        : manager.risk === "watch"
        ? "This manager is on the watch list — early warning signs."
        : "This manager is healthy — focus the brief on growth, not remediation.";

    const themeBlock = Array.isArray(commentThemes) && commentThemes.length
      ? `\n\nQualitative comment themes from this cycle (org-wide, names removed):\n${JSON.stringify(commentThemes, null, 2)}`
      : "";

    const user = `Manager: ${manager.name}
Team size: ${manager.teamSize}
CDI Score: ${manager.score}/100
Trend vs last cycle: ${manager.delta >= 0 ? "+" : ""}${manager.delta} pts
Risk band: ${manager.risk}

Context: ${riskNarrative}${themeBlock}

Write the coaching brief now.`;

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
          { role: "user", content: user },
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("coaching-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
