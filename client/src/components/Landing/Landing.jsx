import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import authService from "../../services/authService";
import leadService from "../../services/leadService";

const C = {
  bg: "#05070A",
  text: "#dce4e5",
  textMuted: "#b9cacb",
  textDim: "rgba(185,202,203,0.7)",
  primary: "#00dbe9",
  primaryHover: "#00f0ff",
  onPrimary: "#002022",
  secondary: "#571bc1",
  greenOk: "#34d399",
  glassBg: "rgba(11, 17, 32, 0.6)",
  glassBorder: "rgba(255, 255, 255, 0.05)",
  rim: "rgba(0, 240, 255, 0.3)",
  inputBg: "rgba(255,255,255,0.05)",
  inputBorder: "rgba(255,255,255,0.10)",
};

const font = '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif';

// Inline style helpers reused across the card decorations.
const glassPanel = {
  background: C.glassBg,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${C.glassBorder}`,
  borderTop: `1px solid ${C.rim}`,
  boxShadow: "inset 0 1px 1px rgba(0, 240, 255, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.5)",
};

const Landing = () => {
  const navigate = useNavigate();

  // Authenticated visitors should never see the landing page — bounce them
  // straight into the product.
  if (authService.isAuthenticated()) {
    return <Navigate to="/chat" replace />;
  }

  const [form, setForm] = useState({ fullName: "", company: "", email: "", phone: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.fullName.trim()) { setError("Please enter your full name."); return; }
    if (!form.email.trim()) { setError("Please enter your work email."); return; }
    setSubmitting(true);
    try {
      const data = await leadService.submit(form);
      setSuccess(data?.message || "Thanks! We will be in touch shortly.");
      setForm({ fullName: "", company: "", email: "", phone: "", location: "" });
    } catch (err) {
      const msg = err?.response?.data?.error || "Something went wrong. Please try again.";
      setError(msg);
      console.error("Lead submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: font,
      position: "relative",
      overflowX: "hidden",
    }}>
      <LandingStyles />

      {/* Global glow background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "100vw", height: "1024px",
          background: "radial-gradient(circle at center, rgba(0, 240, 255, 0.15) 0%, rgba(87, 27, 193, 0.1) 40%, transparent 70%)",
          filter: "blur(80px)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "409px",
          background: "linear-gradient(to top, rgba(0, 219, 233, 0.05), transparent)",
        }} />
      </div>

      {/* Header */}
      <header style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 50 }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "32px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            color: "#fff", fontWeight: 900, fontSize: "1.25rem", letterSpacing: "-0.02em",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "9999px",
              background: C.primary, boxShadow: `0 0 10px ${C.primary}`,
            }} />
            Rivet AI
          </div>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "transparent", border: `1px solid ${C.glassBorder}`,
              color: C.textMuted, fontFamily: font, fontSize: "0.8rem", fontWeight: 600,
              padding: "8px 16px", borderRadius: 8, cursor: "pointer", letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.rim; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.glassBorder; }}
          >
            Sign in
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{
        position: "relative", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingTop: 120, paddingBottom: 140,
      }}>
        {/* Floating UI cards (hidden on small screens to avoid overlap) */}
        <div className="rivet-floats" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* AI Calling */}
          <FloatingCard style={{ top: "20%", left: "8%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "9999px",
                background: "rgba(0, 219, 233, 0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="material-symbols-outlined" style={{ color: C.primary, fontSize: 22 }}>phone_callback</span>
              </div>
              <div>
                <p style={labelStyle}>AI Calling</p>
                <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>Active Interview · 02:45</p>
              </div>
            </div>
          </FloatingCard>

          {/* Compliance Verified */}
          <FloatingCard style={{ top: "15%", right: "12%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="material-symbols-outlined" style={{ color: C.greenOk, fontSize: 22, fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <p style={{ ...labelStyle, color: "#fff" }}>Compliance Verified</p>
            </div>
          </FloatingCard>

          {/* AI Chat Assistant */}
          <FloatingCard style={{ bottom: "20%", left: "12%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Avatar bg="linear-gradient(135deg, #5b8dee, #7df4ff)" label="DR" />
                <Avatar bg={`${C.secondary}`} label="AI" offset />
              </div>
              <div style={{ fontSize: 12, color: C.text }}>
                Candidate matching... <span style={{ color: C.primary, fontWeight: 600 }}>89%</span>
              </div>
            </div>
          </FloatingCard>

          {/* Email Sent */}
          <FloatingCard style={{ bottom: "15%", right: "8%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="material-symbols-outlined" style={{ color: C.primary, fontSize: 22 }}>forward_to_inbox</span>
              <div style={{ fontSize: 12 }}>
                <p style={{ color: "#fff", fontWeight: 500, margin: 0 }}>Email Sent</p>
                <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>Onboarding link delivered</p>
              </div>
            </div>
          </FloatingCard>
        </div>

        {/* Hero content */}
        <div style={{
          position: "relative", zIndex: 10,
          width: "100%", maxWidth: 768, padding: "0 32px",
          textAlign: "center",
        }}>
          <h1 className="rivet-h1" style={{
            color: "#fff", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em",
            margin: 0, marginBottom: 24,
          }}>
            AI for Healthcare{" "}
            <span style={{
              background: `linear-gradient(to right, ${C.primary}, #d0bcff)`,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              color: "transparent",
            }}>
              Recruitment
            </span>
          </h1>
          <p style={{
            fontSize: 18, lineHeight: 1.6, color: C.textMuted,
            maxWidth: 576, margin: "0 auto 80px",
          }}>
            Automate calls, compliance, and communication — all in one platform.
            Built for the high-stakes world of medical staffing.
          </p>

          {/* Glass form card */}
          <div style={{
            ...glassPanel,
            padding: 48, borderRadius: 16,
            boxShadow: "inset 0 1px 1px rgba(0, 240, 255, 0.1), 0 20px 50px rgba(0,10,30,0.8)",
            maxWidth: 672, margin: "0 auto",
          }}>
            <form onSubmit={onSubmit} className="rivet-form" style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, textAlign: "left",
            }}>
              <Field label="Full Name" name="fullName" placeholder="Dr. Sarah Chen" value={form.fullName} onChange={onChange} required />
              <Field label="Company Name" name="company" placeholder="Central Health" value={form.company} onChange={onChange} />
              <Field label="Work Email" name="email" placeholder="sarah@health.ai" type="email" value={form.email} onChange={onChange} required />
              <Field label="Phone Number" name="phone" placeholder="+1 (555) 000-0000" type="tel" value={form.phone} onChange={onChange} />
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={fieldLabelStyle}>Location</label>
                <div style={{ position: "relative" }}>
                  <input
                    name="location" value={form.location} onChange={onChange}
                    type="text" placeholder="City, Country"
                    style={inputStyle}
                    onFocus={(e) => onFocusInput(e)}
                    onBlur={(e) => onBlurInput(e)}
                  />
                  <span className="material-symbols-outlined" style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    color: C.textMuted, fontSize: 16, pointerEvents: "none",
                  }}>location_on</span>
                </div>
              </div>

              {error && (
                <div style={{ gridColumn: "1 / -1", color: "#ffb4ab", fontSize: 13, padding: "8px 12px", background: "rgba(105,0,5,0.25)", border: "1px solid rgba(255,180,171,0.2)", borderRadius: 8 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ gridColumn: "1 / -1", color: C.greenOk, fontSize: 13, padding: "8px 12px", background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 8 }}>
                  {success}
                </div>
              )}

              <div style={{ gridColumn: "1 / -1", paddingTop: 24 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "16px 0",
                    background: submitting ? "rgba(0, 219, 233, 0.5)" : C.primary,
                    color: C.onPrimary, fontFamily: font, fontWeight: 700, fontSize: 15,
                    border: "none", borderRadius: 8, cursor: submitting ? "default" : "pointer",
                    boxShadow: "0 0 20px rgba(0, 219, 233, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.background = C.primaryHover; e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 219, 233, 0.5)"; } }}
                  onMouseLeave={(e) => { if (!submitting) { e.currentTarget.style.background = C.primary; e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 219, 233, 0.3)"; } }}
                >
                  {submitting ? "Submitting…" : "Request Early Access"}
                </button>
              </div>
            </form>

            <div style={{ paddingTop: 24, textAlign: "center" }}>
              <p style={{
                fontSize: 12, color: C.textDim,
                display: "inline-flex", alignItems: "center", gap: 8,
                margin: 0, letterSpacing: "0.05em", fontWeight: 600,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "9999px",
                  background: C.primary,
                  animation: "rivetPulse 2s ease-in-out infinite",
                }} />
                Private beta · Limited access
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ position: "absolute", bottom: 0, left: 0, width: "100%", zIndex: 40 }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "32px",
          display: "flex", justifyContent: "center", opacity: 0.3, pointerEvents: "none",
        }}>
          <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
            <div style={{ height: 1, width: 48, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.2))" }} />
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, color: C.textMuted }}>
              Built for Scale · Trusted by Clinicians
            </div>
            <div style={{ height: 1, width: 48, background: "linear-gradient(to left, transparent, rgba(255,255,255,0.2))" }} />
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Subcomponents -------------------------------------------------------

const FloatingCard = ({ style, children }) => (
  <div style={{
    ...glassPanel,
    position: "absolute",
    padding: 24,
    borderRadius: 12,
    ...style,
  }}>
    {children}
  </div>
);

const Avatar = ({ bg, label, offset }) => (
  <div style={{
    width: 32, height: 32, borderRadius: "9999px",
    background: bg,
    border: `2px solid #0B1120`,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: 10, fontWeight: 700,
    marginLeft: offset ? -8 : 0,
  }}>
    {label}
  </div>
);

const fieldLabelStyle = {
  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.1em", color: C.textDim, paddingLeft: 4,
};

const labelStyle = {
  fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
  color: C.primary, margin: 0, textTransform: "uppercase",
};

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: 8,
  padding: "12px 16px", color: C.text, fontFamily: font, fontSize: 14,
  outline: "none", transition: "all 0.2s ease",
};

const onFocusInput = (e) => {
  e.target.style.borderColor = C.primary;
  e.target.style.boxShadow = `0 0 0 1px ${C.primary}`;
};
const onBlurInput = (e) => {
  e.target.style.borderColor = C.inputBorder;
  e.target.style.boxShadow = "none";
};

const Field = ({ label, name, value, onChange, type = "text", placeholder, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={fieldLabelStyle} htmlFor={`f-${name}`}>{label}</label>
    <input
      id={`f-${name}`} name={name} value={value} onChange={onChange}
      type={type} placeholder={placeholder} required={required}
      style={inputStyle}
      onFocus={onFocusInput} onBlur={onBlurInput}
    />
  </div>
);

// Page-scoped CSS for things inline styles can't do (keyframes, media queries,
// placeholder color).
const LandingStyles = () => (
  <style>{`
    @keyframes rivetPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.4; transform: scale(0.85); }
    }
    .rivet-h1 { font-size: 56px; }
    .rivet-form input::placeholder { color: rgba(185,202,203,0.4); }
    @media (max-width: 900px) {
      .rivet-floats { display: none; }
    }
    @media (max-width: 700px) {
      .rivet-h1 { font-size: 40px !important; }
      .rivet-form { grid-template-columns: 1fr !important; gap: 16px !important; }
    }
  `}</style>
);

export default Landing;
