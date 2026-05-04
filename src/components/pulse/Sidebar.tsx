import { memo } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Home, Users, Grid3x3, LineChart, MessageSquare, Settings, LogOut, UserCircle2, Map, Target } from "lucide-react";

const items = [
  { to: "/",             label: "Overview",     icon: Home },
  { to: "/managers",     label: "Managers",     icon: Users },
  { to: "/demographics", label: "Demographics", icon: UserCircle2, sub: true },
  { to: "/heatmap",      label: "Heatmap",      icon: Grid3x3 },
  { to: "/culture-map",  label: "Culture Map",  icon: Map },
  { to: "/development-tracks", label: "Development Tracks", icon: Target },
  { to: "/trends",       label: "Trends",       icon: LineChart },
  { to: "/comments",     label: "Comments",     icon: MessageSquare },
];

function SidebarBase() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col bg-card border-r border-border z-30"
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary-foreground" />
          </div>
          <span className="font-medium text-[15px] tracking-tight">GMI Pulse</span>
        </div>

        {/* User */}
        <div className="mt-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-medium">
            PS
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-medium">Priya Sharma</div>
            <div className="text-[11px] text-muted-foreground">HR Head</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 mt-2 flex-1">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.03, duration: 0.2 }}
            >
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-pill text-[13px] transition-colors ${
                    item.sub ? "ml-6" : ""
                  } ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  }`
                }
              >
                <Icon size={item.sub ? 14 : 16} strokeWidth={2} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-5 space-y-3">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-pill text-[13px] text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-colors"
        >
          <Settings size={16} />
          <span className="font-medium">Settings</span>
        </button>

        <div className="px-3 py-2 rounded-pill bg-accent/20 text-[11px] font-medium text-foreground/80 text-center">
          Free Trial — 28 days left
        </div>

        <button className="w-full flex items-center gap-2 px-3 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </motion.aside>
  );
}

export const Sidebar = memo(SidebarBase);
