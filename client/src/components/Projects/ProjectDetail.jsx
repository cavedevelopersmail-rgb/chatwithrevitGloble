import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar, Menu, MenuItem, useTheme, useMediaQuery, TextField, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from "@mui/material";
import {
  Logout, Menu as MenuIcon, Close, ArrowBack, Send,
  Chat as ChatBubbleIcon, BarChart, Folder, CloudUpload, Delete,
  InsertDriveFile, Edit as EditIcon, Settings, Link as LinkIcon,
  TableChart, OpenInNew,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import authService from "../../services/authService";
import projectService from "../../services/projectService";
import rivetLogo from "../../assets/rivetGlobalpng.png";

const C = {
  bg: "#0c1117", sidebar: "#111827", surface: "#131929",
  card: "#1a2234", cardHover: "#1f2a40", border: "#1e2d45",
  accent: "#5b8dee", accentDim: "rgba(91,141,238,0.12)", accentText: "#93c5fd",
  text: "#f1f5f9", muted: "#64748b", mutedLight: "#94a3b8", error: "#f87171",
  userBubble: "#1e3a6e", userBubbleBorder: "#2563eb",
  aiBubble: "#131929", aiBubbleBorder: "#1e2d45",
};
const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const NAV_ITEMS = [
  { icon: <ChatBubbleIcon sx={{ fontSize: 18 }} />, label: "Conversations", id: "chat", path: "/chat" },
  { icon: <BarChart sx={{ fontSize: 18 }} />, label: "Dashboard", id: "dashboard", path: "/dashboard" },
  { icon: <Folder sx={{ fontSize: 18 }} />, label: "Projects", id: "projects", path: "/projects" },
];

const TypingIndicator = () => (
  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
    {[0, 1, 2].map((i) => (
      <motion.div key={i}
        style={{ width: 6, height: 6, backgroundColor: C.accent, borderRadius: "50%", opacity: 0.7 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
      />
    ))}
  </div>
);

const formatBytes = (b) => {
  if (!b) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [instructionsDraft, setInstructionsDraft] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (e) {
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          authService.logout(); navigate("/login"); return;
        }
      }
      try {
        const data = await projectService.get(id);
        setProject(data.project);
        setDraftName(data.project.name);
        setInstructionsDraft(data.project.instructions || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleLogout = () => { authService.logout(); navigate("/login"); };

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      await projectService.uploadSource(id, file);
      const data = await projectService.get(id);
      setProject(data.project);
    } catch (e) {
      setUploadError(e?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLink = async () => {
    const url = linkUrl.trim();
    if (!url) { setLinkError("Paste a Google Sheets link."); return; }
    setLinkError("");
    setLinkLoading(true);
    try {
      await projectService.addSourceLink(id, url);
      const data = await projectService.get(id);
      setProject(data.project);
      setLinkDialogOpen(false);
      setLinkUrl("");
    } catch (e) {
      setLinkError(e?.response?.data?.error || "Could not add the sheet.");
    } finally {
      setLinkLoading(false);
    }
  };

  const closeLinkDialog = () => {
    if (linkLoading) return;
    setLinkDialogOpen(false);
    setLinkError("");
    setLinkUrl("");
  };

  const handleDeleteSource = async (sourceId) => {
    try {
      await projectService.deleteSource(id, sourceId);
      setProject((p) => ({ ...p, sources: p.sources.filter((s) => s._id !== sourceId) }));
    } catch (e) { console.error(e); }
  };

  const handleSend = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    const userMsg = { role: "user", content: text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await projectService.chat(id, text, history);
      setMessages((m) => [...m, { role: "assistant", content: data.response, ts: Date.now(), sources: data.usedSources || [] }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: err?.response?.data?.error || "Something went wrong.", ts: Date.now(), error: true }]);
    } finally {
      setThinking(false);
    }
  };

  const handleSaveName = async () => {
    const v = draftName.trim();
    if (!v || v === project.name) { setEditingName(false); setDraftName(project.name); return; }
    try {
      await projectService.update(id, { name: v });
      setProject((p) => ({ ...p, name: v }));
    } catch (e) { console.error(e); }
    setEditingName(false);
  };

  const handleSaveSettings = async (patch) => {
    try {
      await projectService.update(id, patch);
      setProject((p) => ({ ...p, ...patch }));
    } catch (e) { console.error(e); }
  };

  const Sidebar = () => (
    <div style={{ width: 220, minWidth: 220, backgroundColor: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", fontFamily: font }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
        <img src={rivetLogo} alt="Rivet AI" style={{ width: 28, height: 28, borderRadius: "6px", objectFit: "cover" }} />
        <span style={{ color: C.text, fontWeight: 700, fontSize: "1rem" }}>Rivet AI</span>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 0 }}>
            <Close sx={{ fontSize: 18 }} />
          </button>
        )}
      </div>
      <div style={{ padding: "12px 8px 8px" }}>
        {NAV_ITEMS.map((item) => (
          <div key={item.id} onClick={() => navigate(item.path)}
            style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px",
              borderRadius: "8px", marginBottom: "2px", cursor: "pointer",
              backgroundColor: item.id === "projects" ? C.accentDim : "transparent",
              color: item.id === "projects" ? C.accentText : C.muted,
              transition: "background-color 0.15s", userSelect: "none",
            }}
            onMouseEnter={(e) => { if (item.id !== "projects") e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { if (item.id !== "projects") e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {item.icon}
            <span style={{ fontSize: "0.875rem", fontWeight: item.id === "projects" ? 600 : 400 }}>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
    </div>
  );

  if (loading) {
    return <div style={{ height: "100vh", backgroundColor: C.bg, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>Loading…</div>;
  }
  if (!project) {
    return (
      <div style={{ height: "100vh", backgroundColor: C.bg, color: C.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: font, gap: 12 }}>
        <div>Project not found.</div>
        <button onClick={() => navigate("/projects")} style={{ backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Back to projects</button>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", fontFamily: font, overflow: "hidden", position: "fixed", inset: 0 }}>
      {/* TOP BAR */}
      <div style={{ height: 52, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: "12px", flexShrink: 0, zIndex: 10 }}>
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
        <button onClick={(e) => setAnchorEl(e.currentTarget)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: "8px", cursor: "pointer", color: C.text, fontFamily: font, display: "flex", alignItems: "center", gap: "10px", padding: "6px 12px 6px 8px" }}>
          <Avatar sx={{ width: 26, height: 26, backgroundColor: C.accent, fontSize: "0.75rem", fontWeight: 700 }}>{user?.username?.[0]?.toUpperCase()}</Avatar>
          {!isMobile && (
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{user?.username?.toUpperCase()}</div>
              <div style={{ fontSize: "0.65rem", color: C.muted }}>Free Plan</div>
            </div>
          )}
        </button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, minWidth: 160, fontFamily: font } }}>
          <MenuItem onClick={handleLogout} sx={{ fontFamily: font, fontSize: "0.875rem", gap: 1, color: C.mutedLight, "&:hover": { backgroundColor: "rgba(255,255,255,0.05)", color: C.text } }}>
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
        <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "hidden" }}>

          {/* SOURCES PANEL */}
          <div style={{ width: isMobile ? "100%" : 320, minWidth: isMobile ? "auto" : 320, borderRight: isMobile ? "none" : `1px solid ${C.border}`, borderBottom: isMobile ? `1px solid ${C.border}` : "none", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: C.surface }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => navigate("/projects")} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 4 }}>
                <ArrowBack sx={{ fontSize: 18 }} />
              </button>
              {editingName ? (
                <input
                  autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)}
                  onBlur={handleSaveName} onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setEditingName(false); setDraftName(project.name); } }}
                  style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", color: C.text, fontFamily: font, fontSize: "0.95rem", fontWeight: 600 }}
                />
              ) : (
                <div onClick={() => setEditingName(true)} title="Rename" style={{ flex: 1, color: C.text, fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {project.name}
                </div>
              )}
              <Tooltip title="Settings">
                <button onClick={() => setSettingsOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 4 }}>
                  <Settings sx={{ fontSize: 16 }} />
                </button>
              </Tooltip>
            </div>

            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
              <input
                ref={fileInputRef} type="file"
                accept=".pdf,.docx,.xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.tsv,.txt,.md,.markdown,.json,.log,.html,.htm,.xml,.rtf,.yaml,.yml"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px", borderRadius: 8, backgroundColor: uploading ? "transparent" : C.accentDim, color: C.accentText, border: `1px dashed ${C.accent}`, cursor: uploading ? "default" : "pointer", fontFamily: font, fontSize: "0.85rem", fontWeight: 600 }}
              >
                <CloudUpload sx={{ fontSize: 18 }} />
                {uploading ? "Uploading…" : "Upload file"}
              </button>
              <button
                onClick={() => setLinkDialogOpen(true)}
                disabled={uploading || linkLoading}
                style={{ marginTop: 8, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 12px", borderRadius: 8, backgroundColor: "transparent", color: C.mutedLight, border: `1px solid ${C.border}`, cursor: (uploading || linkLoading) ? "default" : "pointer", fontFamily: font, fontSize: "0.82rem", fontWeight: 500 }}
                onMouseEnter={(e) => { if (!uploading && !linkLoading) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.text; } }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.mutedLight; }}
              >
                <LinkIcon sx={{ fontSize: 16 }} />
                Add Google Sheet link
              </button>
              {uploadError && <div style={{ color: C.error, fontSize: "0.75rem", marginTop: 8 }}>{uploadError}</div>}
              <p style={{ color: C.muted, fontSize: "0.7rem", margin: "8px 0 0", textAlign: "center" }}>PDF · Word · Excel · CSV · Text · max 25MB</p>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 20px" }}>
              <div style={{ color: C.muted, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 6px 8px" }}>
                Sources ({project.sources.length})
              </div>
              {project.sources.length === 0 ? (
                <div style={{ color: C.muted, fontSize: "0.8rem", padding: "8px", textAlign: "center" }}>
                  No sources yet.
                </div>
              ) : (
                project.sources.map((s) => {
                  const isDoc = s.kind === "document";
                  const isLinked = !!s.sourceUrl;
                  const ext = (s.originalName.split(".").pop() || "").toUpperCase();
                  return (
                    <div key={s._id} style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isLinked ? <TableChart sx={{ fontSize: 16, color: "#34a853" }} /> : <InsertDriveFile sx={{ fontSize: 16, color: C.accent }} />}
                        <span style={{ flex: 1, color: C.text, fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.originalName}</span>
                        {isLinked && (
                          <Tooltip title="Open in Google Sheets">
                            <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", padding: 2, color: C.muted, textDecoration: "none" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                            >
                              <OpenInNew sx={{ fontSize: 14 }} />
                            </a>
                          </Tooltip>
                        )}
                        <button onClick={() => handleDeleteSource(s._id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 2 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = C.error)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                        >
                          <Delete sx={{ fontSize: 14 }} />
                        </button>
                      </div>
                      <div style={{ marginTop: 6, color: C.muted, fontSize: "0.7rem" }}>
                        {isDoc
                          ? `${ext} · ${(s.charCount || 0).toLocaleString()} chars`
                          : (s.sheets || []).map((sh) => `${sh.name} (${sh.rowCount} rows × ${sh.columns.length} cols)`).join(" · ")}
                      </div>
                      <div style={{ color: C.muted, fontSize: "0.68rem", marginTop: 2 }}>
                        {isLinked ? "Linked Google Sheet · " : ""}{formatBytes(s.sizeBytes)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CHAT */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {messages.length === 0 && !thinking && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "2rem" }}>
                  <img src={rivetLogo} alt="Rivet" style={{ width: 44, height: 44, borderRadius: 10, marginBottom: 12, opacity: 0.9 }} />
                  <div style={{ color: C.text, fontWeight: 600, fontSize: "1.05rem", marginBottom: 4 }}>
                    {project.sources.length === 0 ? "Upload a file to get started" : "Ask anything about your data"}
                  </div>
                  <p style={{ color: C.muted, fontSize: "0.85rem", maxWidth: 380, lineHeight: 1.5, margin: 0 }}>
                    {project.sources.length === 0
                      ? "Add a PDF, Word, Excel, CSV, or text file from the left, then ask questions about its contents."
                      : "I'll only use the content in your uploaded files. If something isn't there, I'll say so."}
                  </p>
                </div>
              )}

              <AnimatePresence>
                {messages.map((m, idx) => (
                  m.role === "user" ? (
                    <div key={idx} style={{ display: "flex", justifyContent: "flex-end" }}>
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                        style={{ backgroundColor: C.userBubble, border: `1px solid ${C.userBubbleBorder}`, borderRadius: "12px 12px 2px 12px", padding: "10px 14px", maxWidth: "75%", color: C.text, fontSize: "0.9rem", lineHeight: 1.55, wordBreak: "break-word" }}>
                        {m.content}
                      </motion.div>
                    </div>
                  ) : (
                    <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: "85%" }}>
                      <img src={rivetLogo} alt="AI" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover", marginTop: 2, flexShrink: 0 }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                        <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
                          style={{ backgroundColor: C.aiBubble, border: `1px solid ${m.error ? C.error : C.aiBubbleBorder}`, borderRadius: "2px 12px 12px 12px", padding: "10px 14px", color: m.error ? C.error : C.text, fontSize: "0.9rem", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {m.content}
                        </motion.div>
                        {!m.error && m.sources && m.sources.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 4 }}>
                            {m.sources.map((s) => (
                              <div key={s._id} title={`Sheets: ${(s.sheetNames || []).join(", ")}`}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.65rem", color: C.mutedLight, backgroundColor: C.accentDim, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 6px" }}>
                                <InsertDriveFile sx={{ fontSize: 10 }} />
                                {s.originalName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </AnimatePresence>

              {thinking && (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <img src={rivetLogo} alt="AI" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ backgroundColor: C.aiBubble, border: `1px solid ${C.aiBubbleBorder}`, borderRadius: "2px 12px 12px 12px", padding: "10px 14px" }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div style={{ padding: "14px 24px 16px", borderTop: `1px solid ${C.border}`, backgroundColor: C.surface, flexShrink: 0 }}>
              <form onSubmit={handleSend} style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "4px 8px 4px 14px" }}>
                <TextField
                  fullWidth multiline maxRows={4} variant="standard"
                  placeholder={project.sources.length === 0 ? "Upload a file to start asking questions…" : "Ask about your uploaded data…"}
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  InputProps={{ disableUnderline: true, style: { color: C.text, fontFamily: font, fontSize: "0.9rem" } }}
                  sx={{ flex: 1 }}
                />
                <button type="submit" disabled={!input.trim() || thinking}
                  style={{ flexShrink: 0, width: 34, height: 34, backgroundColor: input.trim() && !thinking ? C.accent : "transparent", color: input.trim() && !thinking ? "#fff" : C.muted, border: `1px solid ${input.trim() && !thinking ? C.accent : C.border}`, borderRadius: 6, cursor: input.trim() && !thinking ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Send sx={{ fontSize: 16 }} />
                </button>
              </form>
              <p style={{ color: C.muted, fontSize: "0.7rem", textAlign: "center", marginTop: 6, marginBottom: 0 }}>
                Strict source mode · {project.responseMode === "detailed" ? "Detailed answers" : "Short answers"}
                {(project.instructions || "").trim() && <> · <span style={{ color: C.accent }}>Custom role on</span></>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Google Sheet link dialog */}
      <Dialog open={linkDialogOpen} onClose={closeLinkDialog} PaperProps={{ sx: { backgroundColor: C.card, color: C.text, minWidth: 440, maxWidth: 540, border: `1px solid ${C.border}` } }}>
        <DialogTitle sx={{ fontFamily: font, fontSize: "1rem", display: "flex", alignItems: "center", gap: 1 }}>
          <LinkIcon sx={{ fontSize: 18, color: C.accent }} />
          Add a Google Sheet link
        </DialogTitle>
        <DialogContent>
          <p style={{ color: C.mutedLight, fontSize: "0.82rem", lineHeight: 1.55, marginTop: 0, marginBottom: 14 }}>
            Paste the share link from Google Sheets. We'll import every tab as a source — it's a one-time snapshot, so re-add the link if the sheet changes.
          </p>
          <input
            autoFocus
            type="url"
            value={linkUrl}
            onChange={(e) => { setLinkUrl(e.target.value); if (linkError) setLinkError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !linkLoading) handleAddLink(); }}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            disabled={linkLoading}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, backgroundColor: C.bg, color: C.text, border: `1px solid ${linkError ? C.error : C.border}`, fontFamily: font, fontSize: "0.85rem", outline: "none" }}
          />
          {linkError && <div style={{ color: C.error, fontSize: "0.78rem", marginTop: 8, lineHeight: 1.5 }}>{linkError}</div>}
          <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <div style={{ color: C.text, fontSize: "0.76rem", fontWeight: 600, marginBottom: 6 }}>Make the sheet shareable first</div>
            <ol style={{ color: C.mutedLight, fontSize: "0.76rem", lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
              <li>In Google Sheets, click <strong style={{ color: C.text }}>Share</strong> (top right).</li>
              <li>Under <strong style={{ color: C.text }}>General access</strong>, choose <strong style={{ color: C.text }}>Anyone with the link</strong>.</li>
              <li>Set the role to <strong style={{ color: C.text }}>Viewer</strong>, copy the link, paste it above.</li>
            </ol>
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: "8px 24px 18px" }}>
          <Button onClick={closeLinkDialog} disabled={linkLoading} sx={{ color: C.mutedLight, fontFamily: font, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddLink}
            disabled={linkLoading || !linkUrl.trim()}
            variant="contained"
            sx={{ backgroundColor: C.accent, color: "#fff", fontFamily: font, textTransform: "none", boxShadow: "none", "&:hover": { backgroundColor: "#4a7bd9", boxShadow: "none" }, "&.Mui-disabled": { backgroundColor: "rgba(91,141,238,0.25)", color: "rgba(255,255,255,0.5)" } }}
          >
            {linkLoading ? "Importing…" : "Add sheet"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} PaperProps={{ sx: { backgroundColor: C.card, color: C.text, minWidth: 420, maxWidth: 520 } }}>
        <DialogTitle sx={{ fontFamily: font, fontSize: "1rem" }}>Project settings</DialogTitle>
        <DialogContent>
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: C.mutedLight, fontSize: "0.78rem", marginBottom: 6, fontWeight: 600 }}>Custom role / instructions</div>
            <textarea
              value={instructionsDraft}
              onChange={(e) => setInstructionsDraft(e.target.value.slice(0, 4000))}
              onBlur={() => { if (instructionsDraft !== (project.instructions || "")) handleSaveSettings({ instructions: instructionsDraft }); }}
              placeholder={"Tell the AI what role to play and what it should do.\n\nExample: You are a recruiter reviewing CVs. For each question, list candidates that match, with name, years of experience, and key skills."}
              rows={5}
              style={{ width: "100%", boxSizing: "border-box", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontFamily: font, fontSize: "0.82rem", lineHeight: 1.5, resize: "vertical", outline: "none" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <p style={{ color: C.muted, fontSize: "0.7rem", margin: 0 }}>Defines the assistant's role and output style. The strict source-only rule is always enforced.</p>
              <span style={{ color: C.muted, fontSize: "0.68rem" }}>{instructionsDraft.length}/4000</span>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: C.mutedLight, fontSize: "0.78rem", marginBottom: 8, fontWeight: 600 }}>Response style</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ k: "short", l: "Short" }, { k: "detailed", l: "Detailed" }].map((opt) => (
                <button key={opt.k}
                  onClick={() => handleSaveSettings({ responseMode: opt.k })}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${project.responseMode === opt.k ? C.accent : C.border}`, backgroundColor: project.responseMode === opt.k ? C.accentDim : "transparent", color: project.responseMode === opt.k ? C.accentText : C.mutedLight, cursor: "pointer", fontFamily: font, fontSize: "0.8rem", fontWeight: 600 }}
                >{opt.l}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: C.mutedLight, fontSize: "0.78rem", marginBottom: 8, fontWeight: 600 }}>Response speed</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ k: "fast", l: "Fast" }, { k: "medium", l: "Medium" }, { k: "deep", l: "Deep" }].map((opt) => (
                <button key={opt.k}
                  onClick={() => handleSaveSettings({ responseSpeed: opt.k })}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${project.responseSpeed === opt.k ? C.accent : C.border}`, backgroundColor: project.responseSpeed === opt.k ? C.accentDim : "transparent", color: project.responseSpeed === opt.k ? C.accentText : C.mutedLight, cursor: "pointer", fontFamily: font, fontSize: "0.8rem", fontWeight: 600 }}
                >{opt.l}</button>
              ))}
            </div>
            <p style={{ color: C.muted, fontSize: "0.7rem", margin: "8px 0 0" }}>
              Deeper modes include more rows in the AI's context for richer answers on larger sheets.
            </p>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} sx={{ color: C.accent }}>Done</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProjectDetail;
