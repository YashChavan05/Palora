import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Heart, Sunset, Users } from "lucide-react";

const pillars = [
  {
    icon: Heart,
    title: "Remembering Loved Ones",
    description: "Palora preserves the essence of those who meant everything to you — their humor, warmth, and wisdom — so you can always return to that connection.",
    color: "text-palora-pink",
    bgColor: "from-palora-pink/15 to-palora-purple/5",
  },
  {
    icon: Sunset,
    title: "Emotional Healing",
    description: "Grief has no timeline. Palora offers a gentle space to process loss, revisit cherished memories, and find comfort in familiar conversations.",
    color: "text-palora-purple",
    bgColor: "from-palora-purple/15 to-palora-blue/5",
  },
  {
    icon: Users,
    title: "Meaningful Companionship",
    description: "Whether distance separates you or time has, Palora bridges the gap — keeping the people who matter close in the most human way possible.",
    color: "text-palora-blue",
    bgColor: "from-palora-blue/15 to-palora-teal/5",
  },
];

export function EmotionalSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-palora-purple/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
            <Heart className="w-3.5 h-3.5 text-palora-pink" />
            <span className="text-xs font-medium text-palora-pink">The Heart of Palora</span>
          </div>
          <h2 className="font-display font-black text-4xl lg:text-5xl mb-4">
            More than an app.{" "}
            <span className="text-gradient">A sanctuary.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            We built Palora because connection doesn't end. The people who shaped us, who loved us, who made us laugh — their presence deserves to live on.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            const cardRef = useRef(null);
            const cardInView = useInView(cardRef, { once: true, margin: "-60px" });
            return (
              <motion.div
                key={p.title}
                ref={cardRef}
                initial={{ opacity: 0, y: 30 }}
                animate={cardInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="text-center"
              >
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${p.bgColor} flex items-center justify-center mb-5`}>
                  <Icon className={`w-8 h-8 ${p.color}`} />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-3">{p.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 glass gradient-border rounded-3xl p-10 text-center max-w-3xl mx-auto"
        >
          <p className="font-display text-2xl lg:text-3xl font-semibold text-foreground leading-relaxed mb-4">
            "The love we carry for others is the realest thing we have. Palora just gives it a voice."
          </p>
          <p className="text-muted-foreground text-sm">— Palora Team</p>
        </motion.div>
      </div>
    </section>
  );
}
