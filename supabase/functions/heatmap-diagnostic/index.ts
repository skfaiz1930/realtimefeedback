const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const tool = {
  type: "function",
  function: {
    name: "return_findings",
    description: "Return exactly 3 diagnostic findings from heatmap data.",
    parameters: {
      type: "object",
      properties: {
        findings: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              questionId: { type: "string", description: "e.g. Q10" },
              questionText: { type: "string", description: "Short reference, max 60 chars" },
              finding: { type: "string", description: "One sharp sentence, max 20 words, include specific scores" },
              findingType: { type: "string", enum: ["awareness_gap", "systemic_low", "unexpected_drop", "divergence"] },
              urgency: { type: "string", enum: ["high", "medium"] },
            },
            required: ["questionId", "questionText", "finding", "findingType", "urgency"],
            additionalProperties: false,
          },
        },
      },
      required: ["findings"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { questions, commentThemes } = await req.json();
    if (!Array.isArray(questions)) {
      return new Response(JSON.stringify({ error: "Missing questions array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const system = `You are an HR diagnostic specialist at Great Manager Institute. When looking at a 25-question survey heatmap with scores by respondent type, identify the 3 most diagnostically important cells — not just lowest scores. Consider: self-team gaps (awareness issues), unexpected drops in previously strong areas, questions where ALL respondent types score low (systemic issues), and questions where peer and RM scores diverge from team scores. When qualitative comment themes are provided, prefer findings that are corroborated by those themes (mention this in the finding sentence). Write one sharp diagnostic sentence per finding.`;

    const themeBlock = Array.isArray(commentThemes) && commentThemes.length
      ? `\n\nQualitative comment themes (org-wide, for corroboration):\n${JSON.stringify(commentThemes)}`
      : "";

    const userPrompt = `Analyse this heatmap data and identify the 3 most diagnostically important observations:\n\n${JSON.stringify(questions)}${themeBlock}\n\nFor each finding return: questionId, questionText (short), finding (1 sharp sentence, max 22 words, include specific scores; reference comment-theme corroboration if applicable), findingType (awareness_gap | systemic_low | unexpected_drop | divergence), urgency (high | medium). Return exactly 3 findings.`;

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
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_findings" } },
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
      return new Response(JSON.stringify({ error: "No findings returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("heatmap-diagnostic error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
