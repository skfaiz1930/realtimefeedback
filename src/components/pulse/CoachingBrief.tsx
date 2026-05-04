import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { streamEdgeFunction } from "@/lib/aiStream";
import { themesForPrompt } from "@/lib/commentThemes";
import type { Manager } from "@/lib/data";

interface Props { manager: Manager; }

export function CoachingBrief({ manager }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setText("");
    setLoading(true);

    streamEdgeFunction({
      fn: "coaching-brief",
      body: { manager, commentThemes: themesForPrompt() },
      signal: controller.signal,
      onDelta: (chunk) => setText((t) => t + chunk),
      onDone: () => setLoading(false),
      onError: (msg) => {
        setLoading(false);
        toast.error(msg);
      },
    });
  };

  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Brief copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-6 rounded-lg border border-border overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(135deg, #FFF8F8 0%, #FFFFFF 100%)", borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles size={13} />
          </div>
          <div>
            <div className="text-[12px] font-semibold">AI Coaching Brief</div>
            <div className="text-[10.5px] text-muted-foreground">Generated for {manager.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {text && !loading && (
            <button
              onClick={copy}
              className="h-7 px-2.5 rounded-pill border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="h-7 px-3 rounded-pill bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-95 transition-opacity disabled:opacity-60 flex items-center gap-1.5"
          >
            <Sparkles size={11} />
            {loading ? "Generating…" : text ? "Regenerate" : "Generate Brief"}
          </button>
        </div>
      </div>

      {(text || loading) && (
        <div className="px-4 py-4 bg-card">
          {!text && loading && (
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Analysing {manager.name}'s profile…
            </div>
          )}
          {text && (
            <div className="prose prose-sm max-w-none text-[13px] leading-relaxed
              prose-headings:text-[12.5px] prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-primary prose-headings:mt-7 prose-headings:mb-2.5 prose-headings:pb-1.5 prose-headings:border-b prose-headings:border-border first:prose-headings:mt-0
              prose-p:my-2 prose-p:text-foreground/90
              prose-ul:my-2 prose-ul:pl-5 prose-li:my-1 prose-li:text-foreground/90
              prose-ol:my-2 prose-ol:pl-5
              prose-strong:text-foreground prose-strong:font-semibold">
              <ReactMarkdown>{text}</ReactMarkdown>
              {loading && <span className="inline-block w-1 h-3.5 ml-0.5 bg-primary/70 animate-pulse align-middle" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
