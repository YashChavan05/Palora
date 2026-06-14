import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const navigate = useNavigate();

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Glow background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[400px] rounded-full bg-palora-purple/10 blur-[100px]" />
        <div className="w-[400px] h-[300px] rounded-full bg-palora-blue/8 blur-[80px] translate-x-40" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center" ref={ref}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-palora-purple" />
            <span className="text-xs font-medium text-muted-foreground">Start your journey</span>
          </div>

          <h2 className="font-display font-black text-5xl lg:text-7xl mb-6 leading-tight">
            Your memories deserve{" "}
            <span className="text-gradient">a voice.</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of people who've found comfort, healing, and joy through their Palora companions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth?tab=signup")}
              className="btn-primary text-base px-10 py-4 gap-2"
            >
              Create Your Companion
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
              className="btn-ghost text-base px-10 py-4"
            >
              Learn More
            </motion.button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Free to start. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
