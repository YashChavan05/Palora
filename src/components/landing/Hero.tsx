import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Play, Sparkles, Heart, Mic } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

function AIAvatar() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-palora-purple via-palora-blue to-palora-pink opacity-20 animate-pulse-glow" />
      <div className="absolute w-56 h-56 rounded-full border border-palora-purple/20 animate-[spin_20s_linear_infinite]" />
      <div className="absolute w-64 h-64 rounded-full border border-palora-blue/10 animate-[spin_30s_linear_infinite_reverse]" />

      {/* Center avatar card */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 glass gradient-border rounded-3xl p-6 w-48 shadow-glow"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-purple-blue flex items-center justify-center shadow-glow mb-4">
          <span className="text-4xl">👤</span>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground text-sm">Maya</p>
          <p className="text-xs text-muted-foreground">AI Companion</p>
        </div>
        {/* Wave bars */}
        <div className="flex items-end justify-center gap-0.5 mt-3 h-6">
          {[40, 70, 55, 90, 65, 80, 50, 75, 45, 85].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-gradient-to-t from-palora-purple to-palora-blue animate-wave"
              style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </motion.div>

      {/* Floating chips */}
      <motion.div
        animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -top-4 -right-4 glass rounded-xl px-3 py-2 flex items-center gap-2 shadow-glow-sm"
      >
        <Heart className="w-3 h-3 text-palora-pink" />
        <span className="text-xs font-medium text-foreground">Emotion-Aware</span>
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0], x: [0, -4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-4 -left-6 glass rounded-xl px-3 py-2 flex items-center gap-2 shadow-glow-blue"
      >
        <Mic className="w-3 h-3 text-palora-blue" />
        <span className="text-xs font-medium text-foreground">Voice Cloning</span>
      </motion.div>
    </div>
  );
}

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <motion.div variants={container} initial="hidden" animate="show" className="text-center lg:text-left">
            <motion.div variants={item} className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-palora-purple" />
              <span className="text-xs font-medium text-muted-foreground">Next-Gen AI Companions</span>
            </motion.div>

            <motion.h1 variants={item} className="font-display font-black text-5xl lg:text-7xl leading-[1.05] mb-6">
              Reconnect with the{" "}
              <span className="text-gradient">voices that matter.</span>
            </motion.h1>

            <motion.p variants={item} className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Palora lets you recreate meaningful companions using AI personalities, memories, and voice interaction — bringing presence to absence.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/auth?tab=signup")}
                className="btn-primary text-base px-8 py-4 gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/auth")}
                className="btn-ghost text-base px-8 py-4 gap-2"
              >
                <Play className="w-4 h-4" />
                See Demo
              </motion.button>
            </motion.div>

            <motion.div variants={item} className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {["🧑", "👩", "👨", "🧒"].map((emoji, i) => (
                  <div key={i} className="w-9 h-9 rounded-full glass border-2 border-background flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-palora-pink text-sm">★</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Trusted by 10,000+ users</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: AI Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex justify-center lg:justify-end"
          >
            <AIAvatar />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
