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
  Grid,
  Divider,
  Stack,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
  Collapse,
} from "@mui/material";
import {
  LockOutlined,
  EmailOutlined,
  Visibility,
  VisibilityOff,
  Google,
  GitHub,
  ArrowForward,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { styled, alpha } from "@mui/material/styles";
import authService from "../../services/authService";
import rivetLogo from "../../assets/rivetGlobalpng.png";

// --- THEME CONSTANTS ---
const PRIMARY_COLOR = "#3B82F6"; // Electric Blue
const BG_DARK = "#0B0F19"; // Deep Slate
const SURFACE_DARK = "#111827"; // Lighter Slate for cards
const TEXT_SECONDARY = "#9CA3AF";

// --- STYLED COMPONENTS ---

const RootContainer = styled(Box)({
  minHeight: "100vh",
  height: "100dvh", // Fixes mobile address bar scrolling
  display: "flex",
  backgroundColor: BG_DARK,
  overflow: "hidden",
});

// Left Side: The Visual/Branding Area
const BrandSection = styled(Grid)(({ theme }) => ({
  position: "relative",
  background: `radial-gradient(circle at 10% 20%, ${alpha(
    PRIMARY_COLOR,
    0.2
  )} 0%, transparent 40%),
               radial-gradient(circle at 90% 80%, ${alpha(
                 "#8B5CF6",
                 0.15
               )} 0%, ${BG_DARK} 50%)`,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: theme.spacing(6),
  color: "white",
  [theme.breakpoints.down("md")]: {
    display: "none", // Hide on mobile for a cleaner look
  },
}));

// Right Side: The Form Area
const FormSection = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: SURFACE_DARK,
  position: "relative",
  padding: theme.spacing(4),
  boxShadow: "-10px 0 30px rgba(0,0,0,0.2)",
  [theme.breakpoints.down("md")]: {
    backgroundColor: BG_DARK, // Seamless on mobile
    backgroundImage: `radial-gradient(circle at 50% 0%, ${alpha(
      PRIMARY_COLOR,
      0.15
    )} 0%, transparent 50%)`,
  },
}));

const FormWrapper = styled(motion.div)(({ theme }) => ({
  width: "100%",
  maxWidth: "420px",
  padding: theme.spacing(0),
  [theme.breakpoints.down("sm")]: {
    maxWidth: "100%",
  },
}));

// Modern Input Field Styling
const ModernTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  "& .MuiOutlinedInput-root": {
    color: "white",
    backgroundColor: alpha("#fff", 0.03),
    borderRadius: "12px",
    transition: "all 0.2s ease-in-out",
    "& fieldset": {
      borderColor: alpha("#fff", 0.1),
    },
    "&:hover": {
      backgroundColor: alpha("#fff", 0.06),
      "& fieldset": {
        borderColor: alpha("#fff", 0.2),
      },
    },
    "&.Mui-focused": {
      backgroundColor: alpha(PRIMARY_COLOR, 0.05),
      "& fieldset": {
        borderColor: PRIMARY_COLOR,
        borderWidth: "1px",
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: TEXT_SECONDARY,
    "&.Mui-focused": {
      color: PRIMARY_COLOR,
    },
  },
  "& .MuiInputAdornment-root": {
    color: TEXT_SECONDARY,
  },
}));

const ActionButton = styled(Button)({
  backgroundColor: PRIMARY_COLOR,
  color: "white",
  fontWeight: 600,
  fontSize: "1rem",
  padding: "12px 24px",
  borderRadius: "12px",
  textTransform: "none",
  boxShadow: `0 4px 14px 0 ${alpha(PRIMARY_COLOR, 0.4)}`,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: "#2563EB", // Slightly darker blue
    transform: "translateY(-1px)",
    boxShadow: `0 6px 20px 0 ${alpha(PRIMARY_COLOR, 0.6)}`,
  },
  "&:disabled": {
    backgroundColor: alpha(PRIMARY_COLOR, 0.3),
    color: alpha("#fff", 0.5),
  },
});

const SocialButton = styled(Button)(({ theme }) => ({
  borderColor: alpha("#fff", 0.15),
  color: "white",
  textTransform: "none",
  borderRadius: "10px",
  padding: "10px",
  fontSize: "0.9rem",
  fontWeight: 500,
  "&:hover": {
    borderColor: alpha("#fff", 0.3),
    backgroundColor: alpha("#fff", 0.05),
  },
}));

// --- COMPONENT ---

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay for UX (remove in production if desired)
    // await new Promise((resolve) => setTimeout(resolve, 1000));

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
    <RootContainer>
      <Grid container sx={{ height: "100%" }}>
        {/* --- LEFT SIDE: BRANDING (Desktop Only) --- */}
        <BrandSection item md={6} lg={7}>
          {/* Logo / Top area */}
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Box
                component="img"
                src={rivetLogo}
                alt="Rivet Global"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  objectFit: "cover",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  p: 0.5,
                }}
              />
              <Typography variant="h5" fontWeight="700" letterSpacing={1}>
                Rivet <span style={{ color: PRIMARY_COLOR }}>AI</span>
              </Typography>
            </Stack>
          </Box>

          {/* Middle Content */}
          <Box sx={{ maxWidth: "500px", mb: 8 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h2"
                fontWeight="800"
                sx={{ mb: 2, lineHeight: 1.2 }}
              >
                U Turn To Smart <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  intelligence.
                </span>
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: TEXT_SECONDARY, fontWeight: 400 }}
              >
                Experience the next generation Ai Assistant Secure, fast, and
                responsive.
              </Typography>
            </motion.div>
          </Box>

          {/* Bottom Footer */}
          <Box>
            <Typography variant="caption" sx={{ color: alpha("#fff", 0.4) }}>
              © 2025 Rivet AI Inc. All rights reserved.
            </Typography>
          </Box>
        </BrandSection>

        {/* --- RIGHT SIDE: FORM --- */}
        <FormSection item xs={12} md={6} lg={5}>
          <FormWrapper
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Box mb={4} textAlign={{ xs: "center", sm: "left" }}>
              <Typography
                variant="h4"
                fontWeight="700"
                color="white"
                gutterBottom
              >
                Welcome back
              </Typography>
              <Typography variant="body1" color={TEXT_SECONDARY}>
                Please enter your details to sign in.
              </Typography>
            </Box>

            {/* ERROR ALERT */}
            <Collapse in={!!error}>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: "10px",
                  backgroundColor: alpha("#EF4444", 0.1),
                  color: "#FCA5A5",
                  border: `1px solid ${alpha("#EF4444", 0.2)}`,
                }}
              >
                {error}
              </Alert>
            </Collapse>

            <form onSubmit={handleSubmit}>
              <ModernTextField
                fullWidth
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined />
                    </InputAdornment>
                  ),
                }}
              />

              <ModernTextField
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
                      <LockOutlined />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: TEXT_SECONDARY }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                {/* Optional Checkbox could go here */}
                <Box />
                <Link
                  href="#"
                  underline="hover"
                  sx={{
                    color: PRIMARY_COLOR,
                    fontWeight: 500,
                    fontSize: "0.9rem",
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <ActionButton
                fullWidth
                type="submit"
                disabled={loading}
                endIcon={!loading && <ArrowForward />}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Sign in"
                )}
              </ActionButton>
            </form>

            {/* <Box mt={4} mb={3}>
              <Divider
                sx={{
                  "&::before, &::after": { borderColor: alpha("#fff", 0.1) },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: TEXT_SECONDARY, px: 1 }}
                >
                  OR CONTINUE WITH
                </Typography>
              </Divider>
            </Box> */}

            {/* <Stack direction="row" spacing={2} mb={4}>
              <SocialButton fullWidth variant="outlined" startIcon={<Google />}>
                Google
              </SocialButton>
              <SocialButton fullWidth variant="outlined" startIcon={<GitHub />}>
                GitHub
              </SocialButton>
            </Stack> */}

            <Box textAlign="center">
              <Typography variant="body2" color={TEXT_SECONDARY}>
                Don't have an account?{" "}
                <Link
                  component="button"
                  onClick={() => navigate("/register")}
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    textDecoration: "none",
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Create an account
                </Link>
              </Typography>
            </Box>
          </FormWrapper>
        </FormSection>
      </Grid>
    </RootContainer>
  );
};

export default Login;
