import { useEffect, useRef, useState } from "react";
import { Loader2, Phone, Square, X } from "lucide-react";
import { createVapiInstance } from "../utils/vapiLoader";
import { buildInterviewSystemPrompt } from "../utils/interviewPrompt";

interface ConversationPanelProps {
  conversationData: {
    assistantId?: string;
    inviteToken?: string;
    interviewId?: string;
    email?: string;
    jobTitle?: string;
    jobDescription?: string;
    compulsoryQuestions?: string[];
    interviewTimeMinutes?: number;
    resumeData?: any;
    resumeSummary?: string;
    systemPrompt?: string;
    conversationError?: string;
  };
  candidateName: string;
  jobTitle: string;
  inviteToken: string;
  onExit: () => void;
}

type CallState = "idle" | "connecting" | "in-call" | "ended" | "error";

export default function ConversationPanel({
  conversationData,
  candidateName,
  jobTitle,
  inviteToken,
  onExit,
}: ConversationPanelProps) {
  const vapiRef = useRef<any | null>(null);
  const [callState, setCallState] = useState<CallState>("connecting");
  const [error, setError] = useState(conversationData.conversationError ?? "");
  const [audioLevel, setAudioLevel] = useState(0);
  const startAttemptedRef = useRef(false);

  const startCall = async () => {
    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    const assistantId = String(conversationData.assistantId ?? "").trim();

    if (!publicKey) {
      setError("VITE_VAPI_PUBLIC_KEY not configured");
      setCallState("error");
      return;
    }

    if (!assistantId) {
      setError("Interview assistant ID not configured");
      setCallState("error");
      return;
    }

    const systemPrompt = buildInterviewSystemPrompt({
      candidateName,
      inviteToken,
      interviewId: conversationData.interviewId,
      jobTitle: conversationData.jobTitle ?? jobTitle,
      jobDescription: conversationData.jobDescription,
      interviewTimeMinutes: conversationData.interviewTimeMinutes,
      compulsoryQuestions: conversationData.compulsoryQuestions,
      resumeData: conversationData.resumeData,
      resumeSummary: conversationData.resumeSummary,
    });

    try {
      setCallState("connecting");
      setError("");

      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch {
          // ignore
        }
        vapiRef.current = null;
      }

      const vapi = await createVapiInstance(publicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setCallState("in-call");
        setError("");
      });

      vapi.on("call-end", () => {
        setCallState("ended");
      });

      vapi.on("error", (err: any) => {
        console.error("❌ Vapi error event:", {
          message: err?.message,
          error: err,
          stack: err?.stack,
          type: typeof err,
        });
        setError(err?.message || "Error occurred during call");
        setCallState("error");
      });

      vapi.on("message", (message: any) => {
        console.log("📨 Vapi message:", message);

        if (message?.audioLevel) {
          setAudioLevel(Math.min(message.audioLevel * 100, 100));
        }
      });

      await vapi.start(assistantId, {
        variableValues: {
          inviteToken: String(
            conversationData.inviteToken ?? inviteToken ?? "",
          ).trim(),
          interviewId: String(conversationData.interviewId ?? "").trim(),
          candidateName,
          email: String(conversationData.email ?? "").trim(),
          jobTitle: String(conversationData.jobTitle ?? jobTitle ?? "").trim(),
          jobDescription: String(conversationData.jobDescription ?? "").trim(),
          compulsoryQuestions: Array.isArray(
            conversationData.compulsoryQuestions,
          )
            ? conversationData.compulsoryQuestions.join("\n")
            : "",
          interviewTimeMinutes:
            conversationData.interviewTimeMinutes ?? undefined,
          resumeSummary: String(conversationData.resumeSummary ?? "").trim(),
          resumeData:
            typeof conversationData.resumeData === "string"
              ? conversationData.resumeData
              : conversationData.resumeData
                ? JSON.stringify(conversationData.resumeData, null, 2)
                : "",
          systemPrompt,
        },
      });

      console.log(
        "✓ Vapi.start() called successfully with assistantId:",
        assistantId,
      );
    } catch (err: any) {
      const message = err?.message || JSON.stringify(err);
      console.error("❌ Error starting interview:", {
        message,
        fullError: err,
        stack: err?.stack,
        assistantId,
        hasPublicKey: !!publicKey,
      });
      setError(`Failed to start: ${message}`);
      setCallState("error");
    }
  };

  // Auto-start interview when component mounts or assistantId changes
  useEffect(() => {
    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    const assistantId = String(conversationData.assistantId ?? "").trim();

    console.log("🔍 ConversationPanel mounted", {
      hasPublicKey: !!publicKey,
      hasAssistantId: !!assistantId,
      candidateName,
    });

    if (!startAttemptedRef.current && publicKey && assistantId) {
      startAttemptedRef.current = true;
      console.log("▶️ Starting interview auto-start...");
      startCall();
    }

    return () => {
      vapiRef.current?.stop();
      vapiRef.current = null;
    };
  }, [conversationData.assistantId]);

  const stopInterview = () => {
    vapiRef.current?.stop();
    setCallState("ended");
  };

  const restartInterview = async () => {
    startAttemptedRef.current = false;
    await startCall();
  };

  const isAgentSpeaking = callState === "in-call";

  // Animated audio bars for visualizer
  const AudioVisualizer = () => {
    const bars = Array.from({ length: 12 });
    return (
      <div className="flex items-center justify-center gap-1.5 h-48">
        {bars.map((_, i) => {
          const offset = Math.sin((Date.now() / 100 + i) * 0.05) * 0.5 + 0.5;
          const height = isAgentSpeaking
            ? 40 + offset * 40 + audioLevel * 0.2
            : 20 + offset * 10;
          return (
            <div
              key={i}
              className={`w-2 rounded-full transition-all ${
                isAgentSpeaking
                  ? "bg-linear-to-t from-cyan-400 to-blue-500"
                  : "bg-slate-600"
              }`}
              style={{ height: `${Math.max(12, height)}px` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/90 backdrop-blur border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-lg font-bold text-white">
              Interview - {jobTitle}
            </h1>
            <p className="text-xs text-slate-400">{candidateName}</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          title="Exit interview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Banner */}
      {(error || conversationData.conversationError) && (
        <div className="bg-red-900/80 backdrop-blur border-b border-red-700 p-3">
          <p className="text-sm text-red-100">
            {error || conversationData.conversationError}
          </p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        {callState === "connecting" ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-cyan-400" />
            <p className="text-slate-300 text-center text-lg">
              Connecting to interview...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            {/* Audio Visualizer */}
            <div className="rounded-3xl border-2 border-slate-700 bg-linear-to-b from-slate-800/80 to-slate-900/80 backdrop-blur p-12">
              <AudioVisualizer />
            </div>

            {/* Status */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                Interview Status
              </p>
              <p
                className={`text-3xl font-bold capitalize transition-colors ${
                  callState === "in-call"
                    ? "text-cyan-400"
                    : callState === "ended"
                      ? "text-amber-400"
                      : callState === "error"
                        ? "text-red-400"
                        : "text-slate-400"
                }`}
              >
                {callState === "in-call" ? "Recording..." : callState}
              </p>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4">
              {callState === "in-call" ? (
                <button
                  onClick={stopInterview}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-8 py-3 text-white font-semibold transition transform hover:scale-105"
                >
                  <Square className="w-5 h-5" />
                  Stop Interview
                </button>
              ) : null}
              {callState === "ended" || callState === "error" ? (
                <button
                  onClick={restartInterview}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-8 py-3 text-white font-semibold transition transform hover:scale-105"
                >
                  <Loader2 className="w-5 h-5" />
                  Start Again
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-800/90 backdrop-blur border-t border-slate-700 p-3 text-center text-xs text-slate-400">
        <p>
          Your interview is being recorded. All answers will be saved
          automatically.
        </p>
      </div>
    </div>
  );
}
