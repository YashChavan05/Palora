import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CreateCompanion from "./pages/CreateCompanion.tsx";
import Chat from "./pages/Chat.tsx";
import VoiceCall from "./pages/VoiceCall.tsx";
import Memories from "./pages/Memories.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import AnonymousChat from "./pages/AnonymousChat.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/companions" element={<Dashboard />} />
          <Route path="/create-companion" element={<CreateCompanion />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/anonymous-chat" element={<AnonymousChat />} />
          <Route path="/voice-call" element={<VoiceCall />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
