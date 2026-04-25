import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, User, Eye, EyeOff } from "lucide-react";
import authService from "../../services/authService";

const NEON = "#00ff88";
const font = "'Space Grotesk', sans-serif";

const makeInputStyle = () => ({
  backgroundColor: "transparent",
  borderTop: "none",
  borderLeft: "none",
  borderRight: "none",
  borderBottom: "1px solid rgba(0,255,136,0.3)",
  outline: "none",
  borderRadius: 0,
  fontFamily: font,
  fontSize: "1rem",
  color: "white",
  caretColor: NEON,
  width: "100%",
  padding: "12px 12px 12px 40px",
});

const Register = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await authService.register(formData);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", overflow: "hidden", fontFamily: font, backgroundColor: "#000", color: "white" }}>

      {/* ── LEFT PANEL ── */}
      <div
        style={{
          display: "none",
          width: "50%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "5rem",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#0a0a0a",
          borderRight: "1px solid rgba(0,255,136,0.2)",
          backgroundImage: "linear-gradient(to right, rgba(0,255,136,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,255,136,0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        className="obsidian-left-panel"
      >
        {[
          { transform: "rotate(45deg) scale(1.5)" },
          { transform: "rotate(25deg) scale(1.25)" },
          { transform: "rotate(-15deg) scale(1.1)" },
        ].map((s, i) => (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            width: "120%", height: "120%",
            border: `1px solid ${NEON}`,
            opacity: 0.07, pointerEvents: "none",
            ...s, marginTop: "-60%", marginLeft: "-60%",
          }} />
        ))}

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: 48, height: 48, border: `1px solid ${NEON}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
            <span style={{ color: NEON, fontWeight: 700, letterSpacing: "0.1em", fontSize: "1.1rem" }}>CH</span>
          </div>
          <p style={{ color: NEON, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>Compliance House</p>
        </div>

        <div style={{ position: "relative", zIndex: 1, flexGrow: 1, display: "flex", alignItems: "center" }}>
          <div style={{
            fontSize: "clamp(5rem, 10vw, 14rem)",
            fontWeight: 700, lineHeight: 1, userSelect: "none",
            color: "transparent",
            WebkitTextStroke: "1px rgba(0,255,136,0.15)",
          }}>
            NHS<br />AI
          </div>
        </div>

        <p style={{ position: "relative", zIndex: 1, color: "#444", fontSize: "0.8rem", maxWidth: 360 }}>
          Join the platform trusted by 10,000+ NHS compliance professionals.
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem", backgroundColor: "#000" }}>
        <div style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>

          {/* Mobile logo */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ width: 40, height: 40, border: `1px solid ${NEON}`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: NEON, fontWeight: 700, letterSpacing: "0.1em" }}>CH</span>
            </div>
            <p style={{ color: NEON, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>Compliance House</p>
          </div>

          <div style={{ marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.75rem" }}>Create Account</h1>
            <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>Register to access the NHS AI compliance platform.</p>
          </div>

          {error && (
            <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.25)", color: "#ff6b6b", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

              {/* Username */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: "#555", display: "flex" }}>
                  <User size={18} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                  style={makeInputStyle()}
                  onFocus={(e) => (e.target.style.borderBottomColor = NEON)}
                  onBlur={(e) => (e.target.style.borderBottomColor = "rgba(0,255,136,0.3)")}
                />
              </div>

              {/* Email */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: "#555", display: "flex" }}>
                  <Mail size={18} strokeWidth={2} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="NHS Email Address"
                  required
                  style={makeInputStyle()}
                  onFocus={(e) => (e.target.style.borderBottomColor = NEON)}
                  onBlur={(e) => (e.target.style.borderBottomColor = "rgba(0,255,136,0.3)")}
                />
              </div>

              {/* Password */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: "#555", display: "flex" }}>
                  <Lock size={18} strokeWidth={2} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  style={{ ...makeInputStyle(), paddingRight: "40px" }}
                  onFocus={(e) => (e.target.style.borderBottomColor = NEON)}
                  onBlur={(e) => (e.target.style.borderBottomColor = "rgba(0,255,136,0.3)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* CTA */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    backgroundColor: loading ? "rgba(0,255,136,0.5)" : NEON,
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    letterSpacing: "0.08em",
                    padding: "1rem",
                    border: "none",
                    borderRadius: 0,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: font,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.75rem",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#fff"; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = NEON; }}
                >
                  {loading ? "CREATING ACCOUNT..." : (
                    <><span>CREATE ACCOUNT</span><ArrowRight size={18} /></>
                  )}
                </button>

                <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,255,136,0.1)", textAlign: "center" }}>
                  <p style={{ fontSize: "0.75rem", color: "rgba(0,255,136,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      style={{ background: "none", border: "none", cursor: "pointer", color: NEON, fontFamily: font, fontSize: "inherit", letterSpacing: "inherit", textTransform: "inherit", textDecoration: "underline" }}
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .obsidian-left-panel { display: flex !important; }
        }
        input::placeholder { color: #444; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px #000 inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};

export default Register;
