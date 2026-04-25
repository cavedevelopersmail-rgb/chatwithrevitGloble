import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import authService from "../../services/authService";
import rivetLogo from "../../assets/rivetGlobalpng.png";

const C = {
  bg: "#0c1117",
  surface: "#131929",
  card: "#1a2234",
  border: "#1e2d45",
  accent: "#5b8dee",
  accentHover: "#4a7de0",
  text: "#f1f5f9",
  muted: "#64748b",
  error: "#f87171",
};

const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  backgroundColor: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  color: C.text,
  fontSize: "0.95rem",
  fontFamily: font,
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 500,
  color: C.muted,
  marginBottom: "6px",
  letterSpacing: "0.02em",
};

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
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
      const response = await authService.login(formData);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2.5rem", justifyContent: "center" }}>
          <img src={rivetLogo} alt="Rivet AI" style={{ width: 36, height: 36, borderRadius: "8px", objectFit: "cover" }} />
          <span style={{ color: C.text, fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>Rivet AI</span>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "2rem" }}>
          <h1 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.4rem", letterSpacing: "-0.02em" }}>Welcome back</h1>
          <p style={{ color: C.muted, fontSize: "0.875rem", margin: "0 0 1.75rem" }}>Sign in to your Rivet AI account</p>

          {error && (
            <div style={{ backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "8px", padding: "10px 14px", color: C.error, fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@nhsorg.co.uk"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = C.accent)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: "0.8rem", fontFamily: font, padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={(e) => (e.target.style.borderColor = C.accent)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                backgroundColor: loading ? `${C.accent}99` : C.accent,
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.95rem",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: font,
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = C.accentHover; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = C.accent; }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p style={{ color: C.muted, fontSize: "0.85rem", textAlign: "center", marginTop: "1.5rem", marginBottom: 0 }}>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontFamily: font, fontSize: "inherit", fontWeight: 500 }}
            >
              Create one
            </button>
          </p>
        </div>

        <p style={{ color: C.muted, fontSize: "0.75rem", textAlign: "center", marginTop: "1.5rem" }}>
          NHS Compliance Platform · Secure Access
        </p>
      </div>

      <style>{`
        input::placeholder { color: #374151; }
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-text-fill-color: ${C.text};
          -webkit-box-shadow: 0 0 0px 1000px ${C.card} inset;
        }
      `}</style>
    </div>
  );
};

export default Login;
