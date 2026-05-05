import { memo } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Home, Users, Grid3x3, LineChart, MessageSquare, Settings, LogOut, UserCircle2, Map, Target, ChevronsLeft, ChevronsRight, MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarState } from "@/lib/sidebarState";
import { SidebarTrialCountdown } from "./TrialCountdown";
import { useTour } from "@/lib/tourState";

const items = [
  { to: "/",             label: "Overview",     icon: Home },
  { to: "/managers",     label: "Managers",     icon: Users },
  { to: "/demographics", label: "Demographics", icon: UserCircle2, sub: true },
  { to: "/heatmap",      label: "Heatmap",      icon: Grid3x3 },
  { to: "/culture-map",  label: "Culture Map",  icon: Map },
  { to: "/development-tracks", label: "Tracks", icon: Target },
  { to: "/trends",       label: "Trends",       icon: LineChart },
  { to: "/comments",     label: "Comments",     icon: MessageSquare },
];

function SidebarBase() {
  const { collapsed, toggle } = useSidebarState();
  const { start: startTour } = useTour();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="hidden md:flex fixed left-0 top-0 bottom-0 flex-col bg-card border-r border-border z-30"
    >
      {/* Toggle */}
      <button
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-6 z-40 w-6 h-6 rounded-full bg-card border border-border shadow-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronsRight size={12} /> : <ChevronsLeft size={12} />}
      </button>

      {/* Logo */}
      <div className={`pt-6 pb-5 ${collapsed ? "px-3" : "px-5"}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary-foreground" />
          </div>
          {!collapsed && <span className="font-medium text-[15px] tracking-tight">GMI Pulse</span>}
        </div>

        {/* User */}
        <div className={`mt-6 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-medium shrink-0">
            PS
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[13px] font-medium">Priya Sharma</div>
              <div className="text-[11px] text-muted-foreground">HR Head</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav data-tour="sidebar-nav" className={`mt-2 flex-1 ${collapsed ? "px-2" : "px-3"}`}>
        {items.map((item, i) => {
          const Icon = item.icon;
          const link = (
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 my-0.5 rounded-pill text-[13px] transition-colors ${
                  collapsed ? "justify-center px-2 py-2.5" : `px-3 py-2.5 ${item.sub ? "ml-6" : ""}`
                } ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                }`
              }
            >
              <Icon size={item.sub && !collapsed ? 14 : 16} strokeWidth={2} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.02, duration: 0.18 }}
            >
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="text-[11px]">{item.label}</TooltipContent>
                </Tooltip>
              ) : link}
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`pb-5 space-y-3 ${collapsed ? "px-2" : "px-4"}`}>
        <button
          className={`w-full flex items-center gap-3 rounded-pill text-[13px] text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-colors ${
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          }`}
        >
          <Settings size={16} />
          {!collapsed && <span className="font-medium">Settings</span>}
        </button>

        <button
          onClick={startTour}
          className={`w-full flex items-center gap-3 rounded-pill text-[13px] text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-colors ${
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          }`}
          title="Take a tour"
        >
          <MapPin size={16} />
          {!collapsed && <span className="font-medium">Take a tour</span>}
        </button>

        <div data-tour="trial-countdown">
          <SidebarTrialCountdown collapsed={collapsed} />
        </div>

        <button className={`w-full flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors ${
          collapsed ? "justify-center" : "px-3"
        }`}>
          <LogOut size={14} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </motion.aside>
  );
}

export const Sidebar = memo(SidebarBase);
