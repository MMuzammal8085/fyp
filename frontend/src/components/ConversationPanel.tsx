import { useEffect, useRef, useState } from "react";
import { Loader2, Phone, Square, X } from "lucide-react";
import { createVapiInstance } from "../utils/vapiLoader";
import {
  buildVapiAssistantOverrides,
  formatVapiError,
} from "../utils/vapiVariables";

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
    vapiPublicKey?: string;
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
  const transcriptRef = useRef("");
  const callConnectedRef = useRef(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  const displayError = error
    ? formatVapiError(error)
    : conversationData.conversationError
      ? formatVapiError(conversationData.conversationError)
      : "";

  const requestMicrophone = async (): Promise<boolean> => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError(
        "Microphone API not available. Use Chrome/Edge and open the site via http://localhost (not a file URL).",
      );
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (micErr: unknown) {
      setError(
        formatVapiError(micErr) ||
          "Microphone access denied. Allow the mic in browser settings and try again.",
      );
      return false;
    }
  };

  const startCall = async () => {
    const publicKey =
      conversationData.vapiPublicKey ||
      import.meta.env.VITE_VAPI_PUBLIC_KEY;
    const assistantId = String(conversationData.assistantId ?? "").trim();

    if (!publicKey || publicKey.includes("your_public_key")) {
      setError(
        "Vapi public key is not configured. Set VAPI_PUBLIC_KEY in backend/.env and restart the server.",
      );
      setCallState("error");
      return;
    }

    if (!assistantId) {
      setError("Interview assistant ID not configured");
      setCallState("error");
      return;
    }

    const micOk = await requestMicrophone();
    if (!micOk) {
      setCallState("error");
      return;
    }

    const vapiContext = {
      candidateName,
      email: conversationData.email,
      inviteToken: conversationData.inviteToken ?? inviteToken,
      interviewId: conversationData.interviewId,
      jobTitle: conversationData.jobTitle ?? jobTitle,
      jobDescription: conversationData.jobDescription,
      interviewTimeMinutes: conversationData.interviewTimeMinutes,
      compulsoryQuestions: conversationData.compulsoryQuestions,
      resumeData: conversationData.resumeData,
      resumeSummary: conversationData.resumeSummary,
    };

    const assistantOverrides = buildVapiAssistantOverrides(vapiContext);

    try {
      setCallState("connecting");
      setError("");
      callConnectedRef.current = false;
      transcriptRef.current = "";

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

      vapi.on("call-start", async () => {
        callConnectedRef.current = true;
        setCallState("in-call");
        setError("");

        const apiBase =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
        const candidateEmail = String(conversationData.email ?? "")
          .trim()
          .toLowerCase();

        if (candidateEmail) {
          try {
            await fetch(`${apiBase}/vapi/call-started`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: candidateEmail,
                interviewId: conversationData.interviewId,
                inviteToken: conversationData.inviteToken ?? inviteToken,
              }),
            });
          } catch (err) {
            console.warn("Could not mark interview as in progress:", err);
          }
        }
      });

      vapi.on("call-end", async () => {
        if (callConnectedRef.current) {
          setCallState("ended");
        } else {
          setCallState((prev) => (prev === "connecting" ? "error" : prev));
        }

        const finalTranscript = transcriptRef.current.trim();
        const candidateEmail = String(conversationData.email ?? "")
          .trim()
          .toLowerCase();

        if (candidateEmail && finalTranscript) {
          const apiBase =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

          try {
            const response = await fetch(`${apiBase}/vapi/save-transcript`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: candidateEmail,
                transcript: finalTranscript,
                interviewId: conversationData.interviewId,
                inviteToken,
              }),
            });
            const result = await response.json();
            if (!result.success) {
              console.warn("⚠️ Transcript save:", result.message);
            }
          } catch (err) {
            console.error("❌ Error saving transcript:", err);
          }
        }
      });

      vapi.on("call-start-failed", (event: unknown) => {
        console.error("❌ Vapi call-start-failed:", event);
        const message = formatVapiError(
          (event as { error?: unknown })?.error ?? event,
        );
        setError(message);
        setCallState("error");
      });

      vapi.on("error", (err: unknown) => {
        console.error("❌ Vapi error event:", err);
        setError(formatVapiError(err));
        setCallState("error");
      });

      vapi.on("message", (message: any) => {
        if (message?.type === "transcript" && message?.transcript) {
          const role = String(message.role ?? "speaker").trim();
          const line = `${role}: ${String(message.transcript).trim()}`;
          transcriptRef.current = transcriptRef.current
            ? `${transcriptRef.current}\n${line}`
            : line;
        }

        if (message?.type === "status-update" && message?.status === "ended") {
          if (!callConnectedRef.current) {
            setError(
              formatVapiError(message?.endedReason) ||
                "Call ended before the interview started.",
            );
            setCallState("error");
          }
        }

        if (message?.type === "error" || message?.error) {
          setError(formatVapiError(message?.error ?? message));
          setCallState("error");
        }

        if (message?.audioLevel) {
          setAudioLevel(Math.min(message.audioLevel * 100, 100));
        }
      });

      const call = await vapi.start(assistantId, assistantOverrides);
      if (!call) {
        setError(
          "Vapi did not return a call session. Check your public key and assistant ID.",
        );
        setCallState("error");
      }
    } catch (err: unknown) {
      console.error("❌ Error starting interview:", err);
      setError(`Failed to start: ${formatVapiError(err)}`);
      setCallState("error");
    }
  };

  useEffect(() => {
    return () => {
      try {
        vapiRef.current?.stop();
      } catch {
        // ignore
      }
      vapiRef.current = null;
    };
  }, []);

  const stopInterview = () => {
    vapiRef.current?.stop();
    setCallState("ended");
  };

  const restartInterview = async () => {
    callConnectedRef.current = false;
    await startCall();
  };

  const isAgentSpeaking = callState === "in-call";

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
          type="button"
          onClick={onExit}
          className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          title="Exit interview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {displayError ? (
        <div className="bg-red-900/80 backdrop-blur border-b border-red-700 p-3">
          <p className="text-sm text-red-100 whitespace-pre-wrap">{displayError}</p>
        </div>
      ) : null}

      <div className="flex-1 flex items-center justify-center p-6">
        {callState === "idle" ? (
          <div className="flex flex-col items-center justify-center gap-6 max-w-md text-center">
            <p className="text-slate-300 text-lg">
              Your resume is ready. Click below to begin the voice interview.
              Allow microphone access when prompted.
            </p>
            <button
              type="button"
              onClick={() => void startCall()}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-10 py-4 text-white font-semibold text-lg transition"
            >
              <Phone className="w-6 h-6" />
              Start Interview
            </button>
          </div>
        ) : callState === "connecting" ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-cyan-400" />
            <p className="text-slate-300 text-center text-lg">
              Connecting to interview…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            <div className="rounded-3xl border-2 border-slate-700 bg-linear-to-b from-slate-800/80 to-slate-900/80 backdrop-blur p-12">
              <AudioVisualizer />
            </div>

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
                {callState === "in-call" ? "Recording…" : callState}
              </p>
            </div>

            <div className="flex gap-4">
              {callState === "in-call" ? (
                <button
                  type="button"
                  onClick={stopInterview}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-8 py-3 text-white font-semibold transition"
                >
                  <Square className="w-5 h-5" />
                  Stop Interview
                </button>
              ) : null}
              {callState === "ended" || callState === "error" ? (
                <button
                  type="button"
                  onClick={() => void restartInterview()}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-8 py-3 text-white font-semibold transition"
                >
                  <Loader2 className="w-5 h-5" />
                  Start Again
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/90 backdrop-blur border-t border-slate-700 p-3 text-center text-xs text-slate-400">
        <p>
          Your interview is being recorded. All answers will be saved automatically.
        </p>
      </div>
    </div>
  );
}
