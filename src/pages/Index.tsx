import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { DemoChat } from "@/components/landing/DemoChat";
import { EmotionalSection } from "@/components/landing/EmotionalSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { FloatingOrbs } from "@/components/landing/FloatingOrbs";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <FloatingOrbs />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <HowItWorks />
        <Features />
        <DemoChat />
        <EmotionalSection />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
