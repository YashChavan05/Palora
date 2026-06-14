import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getCompanions, sendVoiceChat } from "@/services/api";

export default function VoiceCall() {
  const [searchParams] = useSearchParams();
  const companionId = searchParams.get("id");

  const [callState, setCallState] = useState<"idle" | "calling" | "active" | "ended">("idle");
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const [companions, setCompanions] = useState<any[]>([]);

  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // ── Refs that mirror state so callbacks always see current values ──
  const callStateRef  = useRef<"idle" | "calling" | "active" | "ended">("idle");
  const mutedRef      = useRef(false);
  const isSpeakingRef = useRef(false);
  const speakerOnRef  = useRef(true);

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const audioChunksRef    = useRef<Blob[]>([]);
  const audioPlayerRef    = useRef<HTMLAudioElement | null>(null);
  const timeIntervalRef   = useRef<any>(null);
  const audioContextRef   = useRef<AudioContext | null>(null);
  const analyserRef       = useRef<AnalyserNode | null>(null);
  const silenceStartRef   = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef         = useRef<MediaStream | null>(null);

  // Keep refs in sync with state
  useEffect(() => { callStateRef.current  = callState;  }, [callState]);
  useEffect(() => { mutedRef.current      = muted;      }, [muted]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { speakerOnRef.current  = speakerOn;  }, [speakerOn]);

  useEffect(() => {
    getCompanions()
      .then(res => setCompanions(res.companions || res || []))
      .catch(() => {});

    audioPlayerRef.current = new Audio();

    audioPlayerRef.current.onplay = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
    };

    audioPlayerRef.current.onended = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setAiResponse("");
      // Use refs — not stale state
      if (!mutedRef.current && callStateRef.current === "active") {
        setTimeout(() => startRecording(), 500);
      }
    };

    audioPlayerRef.current.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (!mutedRef.current && callStateRef.current === "active") {
        setTimeout(() => startRecording(), 500);
      }
    };

    return () => {
      stopEverything();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // React to mute toggle while call is active
  useEffect(() => {
    if (callStateRef.current !== "active") return;
    if (muted) {
      stopRecording();
    } else if (!isSpeakingRef.current) {
      startRecording();
    }
  }, [muted]); // eslint-disable-line react-hooks/exhaustive-deps

  const companion = companions.find(c => (c._id || c.id) === companionId)
    || companions[0]
    || { name: "Companion", relationship: "Friend" };

  // Derive avatar from name since DB companions don't store emoji/color
  const initials = companion.name
    ? companion.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "AI";

  const gradients = [
    "from-purple-500 to-blue-500",
    "from-pink-500 to-rose-500",
    "from-teal-500 to-cyan-500",
    "from-orange-500 to-amber-500",
    "from-indigo-500 to-violet-500",
  ];
  const gradientColor = companion.color
    || gradients[(companion.name?.charCodeAt(0) || 0) % gradients.length];

  // ── Recording ──────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    // Guard with refs, not state
    if (mutedRef.current || callStateRef.current !== "active" || isSpeakingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const source  = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Pick a MIME type the browser actually supports
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current   = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        // Only process if there's meaningful audio (> 3 KB)
        if (blob.size > 3000) {
          processVoice(blob, mediaRecorder.mimeType || "audio/webm");
        } else if (callStateRef.current === "active" && !isSpeakingRef.current && !mutedRef.current) {
          startRecording();
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      silenceStartRef.current = null;
      monitorSilence();
    } catch (err) {
      console.error("Mic access error:", err);
      setIsListening(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const monitorSilence = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

    const SILENCE_THRESHOLD = 8;
    const SILENCE_DURATION  = 1500;

    if (volume < SILENCE_THRESHOLD) {
      if (!silenceStartRef.current) silenceStartRef.current = Date.now();
      else if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
        stopRecording();
        return;
      }
    } else {
      silenceStartRef.current = null;
    }

    animationFrameRef.current = requestAnimationFrame(monitorSilence);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  }, []);

  const stopEverything = useCallback(() => {
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    stopRecording();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }
  }, [stopRecording]);

  // ── Voice processing ───────────────────────────────────────────────
  const processVoice = useCallback(async (blob: Blob, mimeType: string) => {
    try {
      setTranscript("Processing...");
      const result = await sendVoiceChat(blob, mimeType, companionId || undefined);

      setTranscript(result.user_text || "");
      setAiResponse(result.ai_text || "");
      setAnalysis(result.analysis);

      if (result.audio) {
        playHexAudio(result.audio);
      } else {
        if (!mutedRef.current && callStateRef.current === "active") startRecording();
      }
    } catch (err) {
      console.error("Voice processing error:", err);
      setTranscript("Connection issue — retrying...");
      if (callStateRef.current === "active" && !mutedRef.current) {
        setTimeout(() => startRecording(), 3000);
      }
    }
  }, [companionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const playHexAudio = useCallback((hex: string) => {
    if (!speakerOnRef.current || !audioPlayerRef.current) {
      if (!mutedRef.current && callStateRef.current === "active") startRecording();
      return;
    }
    try {
      const bytes = new Uint8Array(
        (hex.match(/.{1,2}/g) || []).map(b => parseInt(b, 16))
      );
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url  = URL.createObjectURL(blob);
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play().catch(e => {
        console.error("Playback failed:", e);
        if (!mutedRef.current && callStateRef.current === "active") startRecording();
      });
    } catch {
      if (!mutedRef.current && callStateRef.current === "active") startRecording();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Call control ───────────────────────────────────────────────────
  const startCall = async () => {
    setCallState("calling");
    callStateRef.current = "calling";
    setCallTime(0);

    // Must init AudioContext on a user gesture
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    setTimeout(() => {
      setCallState("active");
      callStateRef.current = "active";
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = setInterval(() => setCallTime(t => t + 1), 1000);
      setAiResponse("Hey! I'm listening.");
      setTimeout(() => startRecording(), 800);
    }, 2000);
  };

  const endCall = () => {
    stopEverything();
    setCallState("ended");
    callStateRef.current = "ended";
    setTranscript("");
    setAiResponse("");
    setAnalysis(null);
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setCallTime(0);
    setTimeout(() => {
      setCallState("idle");
      callStateRef.current = "idle";
    }, 2500);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── UI ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong gradient-border rounded-3xl p-8 text-center"
            style={{ boxShadow: "0 16px 48px hsl(0 0% 0% / .6), 0 8px 16px hsl(0 0% 0% / .4), inset 0 1px 0 hsl(0 0% 100% / .08)" }}
          >
            {/* Avatar */}
            <div className="relative inline-flex items-center justify-center mb-6">
              {(callState === "calling" || callState === "active") && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute w-32 h-32 rounded-full bg-palora-purple/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                    className="absolute w-32 h-32 rounded-full bg-palora-blue/15"
                  />
                </>
              )}
              <motion.div
                animate={callState === "active" ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center text-2xl font-bold text-white relative z-10`}
                style={{ boxShadow: "0 8px 24px hsl(263 70% 57% / .4), inset 0 1px 0 hsl(0 0% 100% / .2)" }}
              >
                {companion.emoji || initials}
              </motion.div>
            </div>

            <h2 className="font-display font-black text-2xl text-foreground mb-1">{companion.name}</h2>
            <p className="text-sm text-muted-foreground mb-2">{companion.relationship}</p>

            {/* Status */}
            <AnimatePresence mode="wait">
              {callState === "active" ? (
                <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                  <p className="text-xs text-palora-teal font-medium">
                    {formatTime(callTime)} &nbsp;·&nbsp;
                    {isListening ? "🎙 Listening..." : isSpeaking ? "🔊 Speaking..." : "Active"}
                  </p>
                  {analysis && (
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                      {analysis.tone} · {analysis.speed} · {analysis.style}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.p key="state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground mb-6">
                  {callState === "calling" ? "Connecting..." : callState === "ended" ? "Call ended" : "Ready to talk"}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Transcript / response */}
            <div className="mb-6 min-h-[56px] px-2 text-sm flex items-center justify-center leading-relaxed">
              {isSpeaking ? (
                <span className="text-foreground font-medium">"{aiResponse}"</span>
              ) : transcript && transcript !== "Processing..." ? (
                <span className="text-palora-teal/80 italic">"{transcript}"</span>
              ) : transcript === "Processing..." ? (
                <span className="text-muted-foreground animate-pulse">Processing...</span>
              ) : isListening ? (
                <span className="text-muted-foreground/50 italic">Speak now...</span>
              ) : null}
            </div>

            {/* Waveform */}
            {callState === "active" && (
              <div className="flex items-end justify-center gap-1 h-8 mb-8">
                {Array.from({ length: 14 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scaleY: (isSpeaking || isListening)
                        ? [0.2, 0.3 + Math.random() * 1.1, 0.2]
                        : 0.15,
                    }}
                    transition={{ duration: 0.35, repeat: Infinity, delay: i * 0.04 }}
                    className={`w-1.5 rounded-full ${isSpeaking ? "bg-palora-pink" : "bg-palora-teal"}`}
                    style={{ height: 24 }}
                  />
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              {callState === "active" && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMuted(m => !m)}
                  className={`p-4 rounded-full transition-all ${muted ? "bg-destructive/20 text-destructive" : "glass text-foreground"}`}
                >
                  {muted ? <MicOff size={20} /> : <Mic size={20} />}
                </motion.button>
              )}

              {callState === "active" ? (
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center"
                  style={{ boxShadow: "0 4px 20px hsl(0 72% 51% / .5), inset 0 1px 0 hsl(0 0% 100% / .15)" }}
                >
                  <PhoneOff size={28} className="text-white" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={startCall}
                  disabled={callState === "calling" || callState === "ended"}
                  className="w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, hsl(175 70% 45%), hsl(217 91% 60%))",
                    boxShadow: "0 4px 20px hsl(175 70% 45% / .5), inset 0 1px 0 hsl(0 0% 100% / .2)",
                  }}
                >
                  <Phone size={28} className="text-white" />
                </motion.button>
              )}

              {callState === "active" && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSpeakerOn(s => !s)}
                  className={`p-4 rounded-full transition-all ${!speakerOn ? "bg-destructive/20 text-destructive" : "glass text-foreground"}`}
                >
                  {speakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
