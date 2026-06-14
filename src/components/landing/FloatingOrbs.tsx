export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="orb animate-float"
        style={{
          width: 600,
          height: 600,
          top: "-15%",
          left: "-10%",
          background: "hsl(263 70% 57% / 0.12)",
          animationDelay: "0s",
        }}
      />
      <div
        className="orb animate-float"
        style={{
          width: 500,
          height: 500,
          top: "20%",
          right: "-15%",
          background: "hsl(217 91% 60% / 0.10)",
          animationDelay: "2s",
        }}
      />
      <div
        className="orb animate-float"
        style={{
          width: 400,
          height: 400,
          bottom: "10%",
          left: "20%",
          background: "hsl(330 81% 60% / 0.08)",
          animationDelay: "4s",
        }}
      />
      <div
        className="orb animate-float"
        style={{
          width: 300,
          height: 300,
          top: "60%",
          right: "10%",
          background: "hsl(175 70% 45% / 0.07)",
          animationDelay: "1s",
        }}
      />
    </div>
  );
}
