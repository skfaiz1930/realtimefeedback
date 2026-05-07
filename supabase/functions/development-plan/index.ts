import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { manager, focusDimension, dimensionScore } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const system =
      "You are an executive coach designing a focused 6-week development plan for a people-manager. " +
      "Use clear markdown with these EXACT sections in this order, each as a level-3 heading (###):\n" +
      "### Focus Summary\n### Weeks 1–2 · Foundations\n### Weeks 3–4 · Practice\n### Weeks 5–6 · Reinforce\n### Success Signals to Watch\n\n" +
      "Each weeks section: 3-4 bullets with concrete actions tied to the focus dimension. " +
      "Success Signals: 3 measurable behaviour changes the HR Head should look for. " +
      "Total length under 320 words. No preamble.";

    const user = `Manager: ${manager.name}
Team size: ${manager.teamSize}
Overall CDI: ${manager.score}/100 (${manager.delta >= 0 ? "+" : ""}${manager.delta} vs last cycle)
Risk band: ${manager.risk}
FOCUS DIMENSION: ${focusDimension} — current score ${dimensionScore}/100

Write the 6-week development plan now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("development-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
