import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBack, Visibility, VisibilityOff, CheckCircle, Cancel } from "@mui/icons-material";
import authService from "../../services/authService";
import adminService from "../../services/adminService";

const C = {
  bg: "#0c1117", surface: "#131929", card: "#1a2234", border: "#1e2d45",
  accent: "#5b8dee", accentDim: "rgba(91,141,238,0.12)", accentText: "#93c5fd",
  text: "#f1f5f9", muted: "#64748b", mutedLight: "#94a3b8",
  ok: "#34a853", warn: "#f59e0b", error: "#f87171",
};
const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const KeyRow = ({ label, info, value, onChange, onSave, onClear, saving, showRaw, onToggleShow }) => {
  const sourceLabel = info?.source === "admin"
    ? "Set in admin panel"
    : info?.source === "env"
    ? "Falling back to environment variable"
    : "Not configured";
  const sourceColor = info?.configured ? (info.source === "admin" ? C.accentText : C.mutedLight) : C.error;
  return (
    <div style={{ padding: 16, border: `1px solid ${C.border}`, borderRadius: 10, backgroundColor: C.card, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: C.text }}>{label}</div>
          <div style={{ fontSize: "0.72rem", color: sourceColor, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
            {info?.configured
              ? <CheckCircle sx={{ fontSize: 14, color: C.ok }} />
              : <Cancel sx={{ fontSize: 14, color: C.error }} />}
            {sourceLabel}
          </div>
        </div>
        {info?.configured && (
          <code style={{ fontSize: "0.72rem", color: C.mutedLight, backgroundColor: C.bg, padding: "4px 8px", borderRadius: 4, border: `1px solid ${C.border}` }}>
            {info.masked}
          </code>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type={showRaw ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={info?.hasOverride ? "Paste a new key to replace…" : "Paste a new key…"}
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
            backgroundColor: C.bg, color: C.text, fontSize: "0.82rem", fontFamily: "monospace",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          style={{ padding: 8, backgroundColor: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.mutedLight, cursor: "pointer", display: "flex" }}
          title={showRaw ? "Hide" : "Show while typing"}
        >
          {showRaw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
        </button>
        <button
          type="button"
          disabled={saving || !value.trim()}
          onClick={onSave}
          style={{
            padding: "9px 14px", borderRadius: 6, border: "none",
            backgroundColor: value.trim() ? C.accent : C.border,
            color: "#fff", fontSize: "0.78rem", fontWeight: 600,
            cursor: value.trim() ? "pointer" : "not-allowed",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {info?.hasOverride && (
        <button
          type="button"
          onClick={onClear}
          disabled={saving}
          style={{
            marginTop: 8, padding: "5px 10px", borderRadius: 5,
            border: `1px solid ${C.border}`, backgroundColor: "transparent",
            color: C.mutedLight, fontSize: "0.72rem", cursor: "pointer",
          }}
        >
          Clear admin override (fall back to env var{info.hasEnv ? "" : " — none configured"})
        </button>
      )}
    </div>
  );
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState(null);
  const [geminiInput, setGeminiInput] = useState("");
  const [openaiInput, setOpenaiInput] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [savingGem, setSavingGem] = useState(false);
  const [savingOai, setSavingOai] = useState(false);
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await authService.getProfile();
        setUser(profile);
        if (!profile.isAdmin) {
          setError("This page is only available to the admin account.");
          setLoading(false);
          return;
        }
        const data = await adminService.getLlmKeys();
        setKeys(data.keys);
      } catch (e) {
        if (e?.response?.status === 401) { authService.logout(); navigate("/login"); return; }
        setError(e?.response?.data?.error || "Failed to load admin panel.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

  const saveKey = async (which, value) => {
    setError(null);
    if (which === "gemini") setSavingGem(true); else setSavingOai(true);
    try {
      const payload = which === "gemini" ? { geminiApiKey: value } : { openaiApiKey: value };
      const data = await adminService.updateLlmKeys(payload);
      setKeys(data.keys);
      if (which === "gemini") setGeminiInput(""); else setOpenaiInput("");
      showFlash(value ? `${which === "gemini" ? "Gemini" : "OpenAI"} key updated.` : `${which === "gemini" ? "Gemini" : "OpenAI"} override cleared.`);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to save key.");
    } finally {
      if (which === "gemini") setSavingGem(false); else setSavingOai(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.mutedLight, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, fontFamily: font, padding: "32px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => navigate("/projects")}
          style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
            padding: "6px 12px", border: `1px solid ${C.border}`, borderRadius: 6,
            backgroundColor: "transparent", color: C.mutedLight, cursor: "pointer", fontSize: "0.78rem",
          }}
        >
          <ArrowBack sx={{ fontSize: 16 }} /> Back to projects
        </button>

        <h1 style={{ fontSize: "1.4rem", margin: "0 0 6px" }}>Admin panel</h1>
        <p style={{ color: C.mutedLight, fontSize: "0.85rem", margin: "0 0 24px" }}>
          Configure the LLM API keys used by the entire application. Keys saved here override the equivalent environment variables and take effect within 30 seconds.
        </p>

        {flash && (
          <div style={{ padding: "10px 14px", borderRadius: 6, backgroundColor: "rgba(52,168,83,0.12)", border: `1px solid ${C.ok}`, color: C.ok, fontSize: "0.82rem", marginBottom: 16 }}>
            {flash}
          </div>
        )}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 6, backgroundColor: "rgba(248,113,113,0.12)", border: `1px solid ${C.error}`, color: C.error, fontSize: "0.82rem", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {keys && (
          <>
            <KeyRow
              label="Gemini API key"
              info={keys.gemini}
              value={geminiInput}
              onChange={setGeminiInput}
              onSave={() => saveKey("gemini", geminiInput.trim())}
              onClear={() => saveKey("gemini", "")}
              saving={savingGem}
              showRaw={showGemini}
              onToggleShow={() => setShowGemini((s) => !s)}
            />
            <KeyRow
              label="OpenAI API key"
              info={keys.openai}
              value={openaiInput}
              onChange={setOpenaiInput}
              onSave={() => saveKey("openai", openaiInput.trim())}
              onClear={() => saveKey("openai", "")}
              saving={savingOai}
              showRaw={showOpenai}
              onToggleShow={() => setShowOpenai((s) => !s)}
            />

            <div style={{ marginTop: 26, padding: 14, border: `1px dashed ${C.border}`, borderRadius: 8, color: C.mutedLight, fontSize: "0.74rem", lineHeight: 1.6 }}>
              <strong style={{ color: C.text }}>How keys are resolved</strong>
              <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                <li>If a key is saved here in the admin panel, it is used.</li>
                <li>Otherwise the corresponding environment variable (<code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code>) is used.</li>
                <li>If neither is set, AI features return a configuration error.</li>
              </ol>
              <div style={{ marginTop: 10 }}>
                Need a Gemini key? Generate one at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: C.accentText }}>aistudio.google.com/apikey</a>. Need an OpenAI key? Generate one at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: C.accentText }}>platform.openai.com/api-keys</a>.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
