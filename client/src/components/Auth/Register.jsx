import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Box,
  Link,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  HowToReg,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { styled } from "@mui/material/styles";
import authService from "../../services/authService";

// --- STYLED COMPONENTS ---

const BackgroundContainer = styled(Box)({
  width: "100%",
  minHeight: "100vh",
  height: "100dvh", // Dynamic Viewport Height for mobile browsers
  background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  overflow: "hidden", // Prevents orbs from causing scrollbars
});

// Floating orbs with pointer-events: none so they don't block inputs
const FloatingOrb = styled(motion.div)(
  ({ size, color, top, left, right, bottom }) => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    background: color,
    filter: "blur(80px)",
    top: top,
    left: left,
    right: right,
    bottom: bottom,
    zIndex: 0,
    opacity: 0.6,
    pointerEvents: "none", // Crucial: lets clicks pass through to the form
  })
);

const GlassCard = styled(motion.div)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "24px",
  // Responsive padding: smaller on mobile, larger on desktop
  padding: "24px",
  [theme.breakpoints.up("sm")]: {
    padding: "40px",
  },
  width: "90%", // Prevents touching edges on mobile
  maxWidth: "420px",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
  zIndex: 1,
  color: "white",
  display: "flex",
  flexDirection: "column",
}));

const StyledTextField = styled(TextField)({
  marginBottom: "20px",
  "& .MuiOutlinedInput-root": {
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    transition: "0.3s",
    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
    "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
    "&.Mui-focused fieldset": {
      borderColor: "#a8c0ff",
      boxShadow: "0 0 10px rgba(168, 192, 255, 0.3)",
    },
  },
  "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#a8c0ff" },
  "& .MuiInputAdornment-root": { color: "rgba(255, 255, 255, 0.7)" },
});

const GradientButton = styled(Button)({
  background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
  border: 0,
  borderRadius: "12px",
  boxShadow: "0 3px 5px 2px rgba(102, 126, 234, .3)",
  color: "white",
  height: 48,
  padding: "0 30px",
  fontSize: "1rem",
  fontWeight: "bold",
  textTransform: "none",
  marginTop: "10px",
  transition: "transform 0.2s ease-in-out",
  "&:hover": {
    background: "linear-gradient(45deg, #764ba2 30%, #667eea 90%)",
    transform: "scale(1.02)",
    boxShadow: "0 0 15px rgba(118, 75, 162, 0.5)",
  },
});

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
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
      setError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundContainer>
      {/* Background Orbs - Responsive sizing */}
      <FloatingOrb
        size="45vw"
        color="#3f2b96"
        top="-5%"
        right="-10%"
        animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ maxWidth: "300px", maxHeight: "300px" }}
      />
      <FloatingOrb
        size="50vw"
        color="#a8c0ff"
        bottom="-10%"
        left="-10%"
        animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ maxWidth: "350px", maxHeight: "350px" }}
      />

      <GlassCard
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <motion.div
            initial={{ rotate: 15, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)",
                boxShadow: "0 0 20px rgba(168, 192, 255, 0.4)",
                mb: 2,
                display: "flex",
              }}
            >
              <HowToReg sx={{ fontSize: 32, color: "white" }} />
            </Box>
          </motion.div>

          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }} // Responsive font size
          >
            Create Account
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.6)", mt: 1, textAlign: "center" }}
          >
            Join us to start chatting with Rivet AI
          </Typography>
        </Box>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography
              color="#ff6b6b"
              sx={{
                mb: 2,
                textAlign: "center",
                bgcolor: "rgba(255,0,0,0.1)",
                p: 1,
                borderRadius: 2,
                border: "1px solid rgba(255,0,0,0.2)",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </Typography>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <StyledTextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              ),
            }}
          />

          <StyledTextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />

          <StyledTextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <GradientButton type="submit" fullWidth disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </GradientButton>

          <Box display="flex" justifyContent="center" mt={3}>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              Already have an account?{" "}
              <Link
                onClick={() => navigate("/login")}
                underline="none"
                sx={{
                  color: "#a8c0ff",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "0.2s",
                  "&:hover": { color: "#fff", textShadow: "0 0 10px #a8c0ff" },
                }}
              >
                Log In
              </Link>
            </Typography>
          </Box>
        </form>
      </GlassCard>
    </BackgroundContainer>
  );
};

export default Register;
