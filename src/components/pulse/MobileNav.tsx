import { Home, Users, Grid3x3, LineChart, MessageSquare } from "lucide-react";

const items = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "managers", label: "Managers", icon: Users },
  { id: "heatmap",  label: "Heatmap",  icon: Grid3x3 },
  { id: "trends",   label: "Trends",   icon: LineChart },
  { id: "comments", label: "Comments", icon: MessageSquare },
];

interface Props {
  active: string;
  onChange: (id: string) => void;
}

export function MobileNav({ active, onChange }: Props) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-30 flex justify-around py-2 px-2">
      {items.map((it) => {
        const Icon = it.icon;
        const a = active === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md ${
              a ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon size={18} />
            <span className="text-[10px] font-medium">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
