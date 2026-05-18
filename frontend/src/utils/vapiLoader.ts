// Centralized Vapi SDK loader to ensure consistent initialization
let VapiClass: any = null;

export const loadVapi = async () => {
  if (!VapiClass) {
    try {
      const mod: any = await import("@vapi-ai/web");

      // Handle various export patterns
      // Pattern 1: default export (ESM)
      if ((mod as any).default && typeof (mod as any).default === "function") {
        VapiClass = (mod as any).default;
      }
      // Pattern 2: direct export (CommonJS with default wrapper)
      else if (
        (mod as any).default &&
        typeof (mod as any).default.default === "function"
      ) {
        VapiClass = (mod as any).default.default;
      }
      // Pattern 3: named export
      else if ((mod as any).Vapi && typeof (mod as any).Vapi === "function") {
        VapiClass = (mod as any).Vapi;
      }
      // Pattern 4: module itself
      else if (typeof mod === "function") {
        VapiClass = mod;
      }
      // Pattern 5: Look for any function property
      else {
        const constructor = Object.values(mod as any).find(
          (val: any) => typeof val === "function",
        );
        if (constructor && typeof constructor === "function") {
          VapiClass = constructor;
        } else {
          console.error("Module contents:", mod);
          throw new Error(
            "Could not find Vapi constructor in module. Check console for module structure.",
          );
        }
      }

      console.log(
        "✓ Vapi SDK loaded successfully, constructor type:",
        typeof VapiClass,
      );
    } catch (err) {
      console.error("✗ Failed to load Vapi SDK:", err);
      throw new Error(
        "Failed to load Vapi SDK. Check browser console for details.",
      );
    }
  }
  return VapiClass;
};

export const createVapiInstance = async (publicKey: string) => {
  const Vapi = await loadVapi();
  if (!Vapi || typeof Vapi !== "function") {
    throw new Error(
      `Vapi is not a valid constructor. Got type: ${typeof Vapi}, value: ${JSON.stringify(Vapi)}`,
    );
  }
  return new Vapi(publicKey);
};
