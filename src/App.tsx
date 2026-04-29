import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Heatmap from "./pages/Heatmap.tsx";
import Demographics from "./pages/Demographics.tsx";
import Trends from "./pages/Trends.tsx";
import CultureMap from "./pages/CultureMap.tsx";
import Comments from "./pages/Comments.tsx";
import NotFound from "./pages/NotFound.tsx";
import { PeriodProvider } from "./lib/periodContext";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/heatmap" element={<Heatmap />} />
        <Route path="/demographics" element={<Demographics />} />
        <Route path="/culture-map" element={<CultureMap />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/comments" element={<Comments />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PeriodProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </PeriodProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
