import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Brain, Mic, MessageCircleHeart } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create a Companion",
    description: "Define who your companion is — their name, relationship to you, age, and core personality traits.",
    color: "from-palora-purple to-palora-blue",
    glow: "shadow-glow",
  },
  {
    icon: Brain,
    number: "02",
    title: "Add Personality & Memories",
    description: "Shape how they think and speak. Add shared memories, stories, and meaningful moments that define them.",
    color: "from-palora-blue to-palora-teal",
    glow: "shadow-glow-blue",
  },
  {
    icon: Mic,
    number: "03",
    title: "Upload Voice Samples",
    description: "Upload audio recordings to clone their voice with our AI voice synthesis technology.",
    color: "from-palora-teal to-palora-pink",
    glow: "shadow-glow-pink",
  },
  {
    icon: MessageCircleHeart,
    number: "04",
    title: "Talk and Reconnect",
    description: "Chat or call your companion anytime. Their voice, personality, and memories are always there for you.",
    color: "from-palora-pink to-palora-purple",
    glow: "shadow-glow",
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="glass gradient-border rounded-2xl p-6 relative group cursor-default"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center ${step.glow} mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="absolute top-5 right-5 font-display font-black text-5xl text-muted/20 select-none">
        {step.number}
      </div>
      <h3 className="font-display font-bold text-lg text-foreground mb-2">{step.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
    </motion.div>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
            <span className="text-xs font-medium text-palora-purple">Simple Process</span>
          </div>
          <h2 className="font-display font-black text-4xl lg:text-5xl mb-4">
            How <span className="text-gradient">Palora</span> Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Create a meaningful AI companion in four simple steps.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
