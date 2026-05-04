import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { TrialCountdown } from "./TrialCountdown";

interface Props {
  children: ReactNode;
  /** When true, reserve right padding for the AI panel (Overview only) */
  withAIRail?: boolean;
  rightSlot?: ReactNode;
}

export function PageShell({ children, withAIRail = false, rightSlot }: Props) {
  const [compare, setCompare] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {rightSlot}

      <main className={`md:pl-[var(--sidebar-w,220px)] ${withAIRail ? "lg:pr-[300px]" : ""} pb-20 md:pb-8 transition-[padding] duration-200`}>
        <div className="max-w-[1180px] mx-auto px-5 md:px-8 pt-7">
          <Header compare={compare} onToggleCompare={() => setCompare((c) => !c)} />
          <TrialCountdown />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
