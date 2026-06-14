import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, MessageSquare, Heart, Mic, Shield, Fingerprint } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Companion Personalities",
    description: "Create deeply personalized AI personalities based on real traits, communication styles, and behaviors.",
    gradient: "from-palora-purple/20 to-palora-blue/10",
    iconColor: "text-palora-purple",
    border: "hover:border-palora-purple/40",
  },
  {
    icon: MessageSquare,
    title: "Memory-Based Conversations",
    description: "Your companion remembers every shared story, inside joke, and important moment you've added.",
    gradient: "from-palora-blue/20 to-palora-teal/10",
    iconColor: "text-palora-blue",
    border: "hover:border-palora-blue/40",
  },
  {
    icon: Heart,
    title: "Emotion-Aware Responses",
    description: "Palora detects emotional context and responds with empathy, comfort, or joy — just like they would.",
    gradient: "from-palora-pink/20 to-palora-purple/10",
    iconColor: "text-palora-pink",
    border: "hover:border-palora-pink/40",
  },
  {
    icon: Mic,
    title: "Voice Conversations",
    description: "Have real-time voice calls with your AI companion using natural speech synthesis and recognition.",
    gradient: "from-palora-teal/20 to-palora-blue/10",
    iconColor: "text-palora-teal",
    border: "hover:border-palora-teal/40",
  },
  {
    icon: Fingerprint,
    title: "Voice Cloning",
    description: "Upload voice samples to recreate a unique, authentic voice signature — a gift of remembrance.",
    gradient: "from-palora-purple/20 to-palora-pink/10",
    iconColor: "text-palora-purple",
    border: "hover:border-palora-purple/40",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "All memories, conversations, and voice data are encrypted end-to-end. Only you have access.",
    gradient: "from-palora-blue/20 to-palora-purple/10",
    iconColor: "text-palora-blue",
    border: "hover:border-palora-blue/40",
  },
];

export function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
            <span className="text-xs font-medium text-palora-blue">Core Features</span>
          </div>
          <h2 className="font-display font-black text-4xl lg:text-5xl mb-4">
            Everything you need to{" "}
            <span className="text-gradient">truly reconnect</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Palora combines advanced AI with emotional intelligence to create companions that feel genuinely present.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            const itemRef = useRef(null);
            const itemInView = useInView(itemRef, { once: true, margin: "-80px" });
            return (
              <motion.div
                key={feat.title}
                ref={itemRef}
                initial={{ opacity: 0, y: 30 }}
                animate={itemInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`glass rounded-2xl p-6 border border-border/40 transition-all duration-300 ${feat.border} cursor-default group`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${feat.iconColor}`} />
                </div>
                <h3 className="font-display font-bold text-base text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
