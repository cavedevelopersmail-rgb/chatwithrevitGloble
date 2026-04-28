import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Logout,
  Menu as MenuIcon,
  Close,
  Chat as ChatBubbleIcon,
  BarChart,
  Assignment,
  TrendingUp,
  AccessTime,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import authService from "../../services/authService";
import conversationService from "../../services/conversationService";
import statsService from "../../services/statsService";
import rivetLogo from "../../assets/rivetGlobalpng.png";

const C = {
  bg: "#0c1117",
  sidebar: "#111827",
  surface: "#131929",
  card: "#1a2234",
  cardHover: "#1f2a40",
  border: "#1e2d45",
  accent: "#5b8dee",
  accentDim: "rgba(91,141,238,0.12)",
  accentText: "#93c5fd",
  text: "#f1f5f9",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  error: "#f87171",
};

const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const NAV_ITEMS = [
  { icon: <ChatBubbleIcon sx={{ fontSize: 18 }} />, label: "Conversations", id: "chat", path: "/chat" },
  { icon: <BarChart sx={{ fontSize: 18 }} />, label: "Dashboard", id: "dashboard", path: "/dashboard" },
  { icon: <Assignment sx={{ fontSize: 18 }} />, label: "Compliance", id: "compliance", soon: true },
];

const StatCard = ({ label, value, sub }) => (
  <div style={{
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: "10px",
    padding: "18px 20px",
    flex: 1,
    minWidth: 0,
  }}>
    <div style={{ color: C.muted, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{label}</div>
    <div style={{ color: C.text, fontWeight: 700, fontSize: "1.6rem", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ color: C.mutedLight, fontSize: "0.72rem", marginTop: "6px" }}>{sub}</div>}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({ totalMessages: 0, totalConversations: 0, lastActiveAt: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (e) {
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          authService.logout();
          navigate("/login");
          return;
        }
        console.error(e);
      }
      const [convRes, overviewRes] = await Promise.allSettled([
        conversationService.getConversations(),
        statsService.getOverview(),
      ]);
      if (convRes.status === "fulfilled") {
        setConversations(convRes.value.conversations || []);
      } else {
        const status = convRes.reason?.response?.status;
        if (status === 401 || status === 403) {
          authService.logout();
          navigate("/login");
          return;
        }
        console.error(convRes.reason);
      }
      if (overviewRes.status === "fulfilled") {
        setStats(overviewRes.value);
      } else {
        console.error(overviewRes.reason);
      }
    };
    init();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const totalConversations = stats.totalConversations || conversations.length;
  const totalMessages = stats.totalMessages || conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0);
  const lastActive = stats.lastActiveAt
    ? new Date(stats.lastActiveAt).getTime()
    : conversations
        .map((c) => new Date(c.updatedAt || c.createdAt).getTime())
        .filter((t) => !isNaN(t))
        .sort((a, b) => b - a)[0];

  const formatRelative = (ts) => {
    if (!ts) return "—";
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const recent = [...conversations]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 6);

  const maxMsg = Math.max(1, ...conversations.map((c) => c.messageCount || 0));
  const topByMessages = [...conversations]
    .sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0))
    .slice(0, 5);

  const Sidebar = () => (
    <div style={{
      width: 220,
      minWidth: 220,
      backgroundColor: C.sidebar,
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      fontFamily: font,
    }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
        <img src={rivetLogo} alt="Rivet AI" style={{ width: 28, height: 28, borderRadius: "6px", objectFit: "cover" }} />
        <span style={{ color: C.text, fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>Rivet AI</span>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 0 }}>
            <Close sx={{ fontSize: 18 }} />
          </button>
        )}
      </div>

      <div style={{ padding: "12px 8px 8px" }}>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            onClick={() => { if (item.path) navigate(item.path); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              borderRadius: "8px",
              marginBottom: "2px",
              cursor: item.soon ? "default" : "pointer",
              backgroundColor: item.id === "dashboard" ? C.accentDim : "transparent",
              color: item.id === "dashboard" ? C.accentText : C.muted,
              transition: "background-color 0.15s",
              userSelect: "none",
            }}
            onMouseEnter={(e) => { if (item.id !== "dashboard" && !item.soon) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { if (item.id !== "dashboard") e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {item.icon}
            <span style={{ fontSize: "0.875rem", fontWeight: item.id === "dashboard" ? 600 : 400 }}>{item.label}</span>
            {item.soon && (
              <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 600, backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "2px 6px", borderRadius: "4px", letterSpacing: "0.05em" }}>
                SOON
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );

  return (
    <div style={{ height: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", fontFamily: font, overflow: "hidden", position: "fixed", inset: 0 }}>

      {/* TOP BAR */}
      <div style={{
        height: 52,
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "12px",
        flexShrink: 0,
        zIndex: 10,
      }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 0 }}>
            <MenuIcon sx={{ fontSize: 20 }} />
          </button>
        )}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src={rivetLogo} alt="Rivet AI" style={{ width: 26, height: 26, borderRadius: "6px", objectFit: "cover" }} />
            <span style={{ color: C.text, fontWeight: 700, fontSize: "0.95rem" }}>Rivet AI</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={(e) => setAnchorEl(e.currentTarget)}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: "8px", cursor: "pointer", color: C.text, fontFamily: font, display: "flex", alignItems: "center", gap: "10px", padding: "6px 12px 6px 8px" }}
        >
          <Avatar sx={{ width: 26, height: 26, backgroundColor: C.accent, fontSize: "0.75rem", fontWeight: 700 }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          {!isMobile && (
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{user?.username?.toUpperCase()}</div>
              <div style={{ fontSize: "0.65rem", color: C.muted }}>Free Plan</div>
            </div>
          )}
        </button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, minWidth: 160, fontFamily: font } }}
        >
          <MenuItem
            onClick={handleLogout}
            sx={{ fontFamily: font, fontSize: "0.875rem", gap: 1, color: C.mutedLight, "&:hover": { backgroundColor: "rgba(255,255,255,0.05)", color: C.text } }}
          >
            <Logout sx={{ fontSize: 16 }} /> Logout
          </MenuItem>
        </Menu>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {isMobile && sidebarOpen && (
          <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex" }}>
            <div style={{ flex: "0 0 240px" }}><Sidebar /></div>
            <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setSidebarOpen(false)} />
          </div>
        )}
        {!isMobile && <Sidebar />}

        {/* MAIN */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", scrollbarWidth: "thin", scrollbarColor: `${C.border} transparent` }}>

          <div style={{ marginBottom: "20px" }}>
            <h1 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Dashboard</h1>
            <p style={{ color: C.muted, fontSize: "0.85rem", margin: 0 }}>Overview of your Rivet AI activity.</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
            <StatCard label="Total messages" value={totalMessages} sub="Across all conversations" />
            <StatCard label="Conversations" value={totalConversations} sub={totalConversations === 1 ? "active thread" : "active threads"} />
            <StatCard label="AI Model" value="GPT-4o" sub="OpenAI" />
            <StatCard label="Status" value={<span style={{ color: "#34d399" }}>● Live</span>} sub={`Last active ${formatRelative(lastActive)}`} />
          </div>

          {/* Two-column section */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: "16px" }}>

            {/* Recent conversations */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px 20px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AccessTime sx={{ fontSize: 16, color: C.accent }} />
                  <span style={{ color: C.text, fontWeight: 600, fontSize: "0.95rem" }}>Recent conversations</span>
                </div>
                <button
                  onClick={() => navigate("/chat")}
                  style={{ background: "none", border: "none", color: C.accent, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: font }}
                >
                  Open chat →
                </button>
              </div>

              {recent.length === 0 ? (
                <div style={{ color: C.muted, fontSize: "0.85rem", padding: "20px 0", textAlign: "center" }}>
                  No conversations yet. Start chatting to see them here.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {recent.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => navigate("/chat")}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 8px", borderRadius: "6px", cursor: "pointer",
                        transition: "background-color 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span style={{ color: C.text, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px" }}>
                        {c.title}
                      </span>
                      <span style={{ color: C.muted, fontSize: "0.72rem", flexShrink: 0 }}>
                        {formatRelative(new Date(c.updatedAt || c.createdAt).getTime())}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Top conversations by activity */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px 20px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <TrendingUp sx={{ fontSize: 16, color: C.accent }} />
                <span style={{ color: C.text, fontWeight: 600, fontSize: "0.95rem" }}>Most active</span>
              </div>

              {topByMessages.length === 0 ? (
                <div style={{ color: C.muted, fontSize: "0.85rem", padding: "20px 0", textAlign: "center" }}>
                  No activity yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {topByMessages.map((c) => {
                    const count = c.messageCount || 0;
                    const pct = (count / maxMsg) * 100;
                    return (
                      <div key={c._id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ color: C.mutedLight, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px" }}>
                            {c.title}
                          </span>
                          <span style={{ color: C.text, fontSize: "0.78rem", fontWeight: 600, flexShrink: 0 }}>
                            {count}
                          </span>
                        </div>
                        <div style={{ height: 6, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            style={{ height: "100%", background: "linear-gradient(90deg, #5b8dee, #8b5cf6)", borderRadius: 3 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
