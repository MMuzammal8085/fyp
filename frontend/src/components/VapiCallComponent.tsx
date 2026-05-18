import { useEffect, useState, useRef } from "react";
import { createVapiInstance } from "../utils/vapiLoader";
import { PhoneOff, Loader2, AlertCircle } from "lucide-react";

interface VapiCallComponentProps {
  callData: {
    assistantId: string;
    systemPrompt: string;
    variableValues?: Record<string, any>;
  };
  email?: string;
  interviewId?: string;
  onCallEnd: () => void;
}

type CallState = "idle" | "connecting" | "in-call" | "ended" | "error";

export default function VapiCallComponent({
  callData,
  email,
  interviewId,
  onCallEnd,
}: VapiCallComponentProps) {
  const vapiRef = useRef<any | null>(null);
  const [callState, setCallState] = useState<CallState>("connecting");
  const [error, setError] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const initializeVapi = async () => {
      try {
        // Create Vapi instance
        const vapi = await createVapiInstance(
          import.meta.env.VITE_VAPI_PUBLIC_KEY || "",
        );

        if (!isMounted) return;
        vapiRef.current = vapi;

        // Set up event listeners
        vapi.on("call-start", () => {
          console.log("Call started");
          setCallState("in-call");
          setError("");
        });

        vapi.on("call-end", async () => {
          console.log("Call ended, saving transcript...");
          setCallState("ended");

          // Save transcript to backend if email is provided
          if (email && transcript) {
            try {
              console.log("📝 Sending transcript to backend for email:", email);
              const response = await fetch(
                `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/vapi/save-transcript`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    transcript: transcript.trim(),
                    interviewId: interviewId,
                  }),
                },
              );

              const result = await response.json();
              if (result.success) {
                console.log("✅ Transcript saved successfully");
              } else {
                console.warn("⚠️ Transcript save response:", result.message);
              }
            } catch (err) {
              console.error("❌ Error saving transcript:", err);
            }
          } else {
            if (!email) {
              console.warn("⚠️ No email provided for transcript saving");
            }
            if (!transcript) {
              console.warn("⚠️ No transcript to save");
            }
          }
        });

        vapi.on("error", (error: any) => {
          console.error("Vapi error:", error);
          setError(error?.message || "An error occurred during the call");
          setCallState("error");
        });

        vapi.on("message", (message: any) => {
          console.log("Message:", message);
          if (message.type === "transcript" && message.transcript) {
            setTranscript((prev) => prev + "\n" + message.transcript);
          }
        });

        vapi.on("speech-start", () => {
          console.log("User speaking...");
        });

        vapi.on("speech-end", () => {
          console.log("User finished speaking");
        });

        // Start the call
        await startCall(vapi);
      } catch (err) {
        console.error("Failed to initialize Vapi:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to initialize Vapi",
          );
          setCallState("error");
        }
      }
    };

    initializeVapi();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startCall = async (vapi: any) => {
    try {
      setCallState("connecting");
      setError("");

      await vapi.start(callData.assistantId, {
        variableValues: {
          ...(callData.variableValues ?? {}),
          systemPrompt: callData.systemPrompt,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start call";
      setError(message);
      setCallState("error");
      console.error("Error starting call:", err);
    }
  };

  const handleHangUp = async () => {
    try {
      if (vapiRef.current) {
        await vapiRef.current.stop();
        setCallState("ended");
      }
    } catch (err) {
      console.error("Error hanging up:", err);
      setError("Failed to end call");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Interview Session</h1>
            <p className="text-blue-100">
              {callState === "connecting"
                ? "Connecting to AI interviewer..."
                : callState === "in-call"
                  ? "Interview in progress"
                  : callState === "ended"
                    ? "Interview completed"
                    : "Connection error"}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Call Status */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                {callState === "connecting" && (
                  <>
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                    <span className="text-lg font-medium text-gray-800">
                      Establishing connection...
                    </span>
                  </>
                )}
                {callState === "in-call" && (
                  <>
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-lg font-medium text-green-700">
                      Live Interview Session
                    </span>
                  </>
                )}
                {callState === "ended" && (
                  <span className="text-lg font-medium text-blue-700">
                    Interview Completed
                  </span>
                )}
                {callState === "error" && (
                  <>
                    <AlertCircle className="text-red-600" size={24} />
                    <span className="text-lg font-medium text-red-700">
                      Connection Error
                    </span>
                  </>
                )}
              </div>

              {/* Call Info */}
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Assistant ID:</strong> {callData.assistantId}
                </p>
                <p>
                  <strong>Status:</strong> {callState}
                </p>
              </div>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Transcript
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {transcript}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">Error:</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Instructions */}
            {callState === "in-call" && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium mb-2">
                  Interview Guide:
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Listen carefully to each question</li>
                  <li>✓ Speak clearly and naturally</li>
                  <li>✓ Take your time to provide thoughtful answers</li>
                  <li>✓ Click "End Interview" when finished</li>
                </ul>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-4">
              {callState === "in-call" && (
                <button
                  onClick={handleHangUp}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <PhoneOff size={20} />
                  End Interview
                </button>
              )}

              {(callState === "ended" || callState === "error") && (
                <>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    New Interview
                  </button>
                  <button
                    onClick={onCallEnd}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Go Back
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t text-xs text-gray-500 text-center">
            Your interview session is being recorded and will be evaluated.
          </div>
        </div>
      </div>
    </div>
  );
}
