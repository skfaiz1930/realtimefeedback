import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-card border-l border-border z-50 shadow-cardHover overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card">
              <h2 className="text-[16px] font-semibold">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className="w-8 h-8 rounded-pill hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
