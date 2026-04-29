import { NavLink } from "react-router-dom";
import { Home, Grid3x3, LineChart, MessageSquare, UserCircle2 } from "lucide-react";

const items = [
  { to: "/",             label: "Overview",     icon: Home },
  { to: "/heatmap",      label: "Heatmap",      icon: Grid3x3 },
  { to: "/demographics", label: "Demographics", icon: UserCircle2 },
  { to: "/trends",       label: "Trends",       icon: LineChart },
  { to: "/comments",     label: "Comments",     icon: MessageSquare },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-30 flex justify-around py-2 px-2">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-md ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Icon size={18} />
            <span className="text-[10px] font-medium">{it.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
