import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ListItemButton,
} from "@mui/material";
import {
  Send,
  Menu as MenuIcon,
  Logout,
  Chat as ChatIcon,
  Close,
  DeleteForever,
  ContentCopy,
  Add,
  Edit as EditIcon,
  Delete,
  Refresh,
  Check,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { styled } from "@mui/material/styles";
import authService from "../../services/authService";
import chatService from "../../services/chatService";
import conversationService from "../../services/conversationService";
import rivetLogo from "../../assets/rivetGlobalpng.png";

const NEON = "#00ff88";
const font = "'Space Grotesk', sans-serif";

// ── STYLED COMPONENTS ──

const ObsidianRoot = styled(Box)(() => ({
  background: "#000",
  height: "100vh",
  width: "100vw",
  display: "flex",
  overflow: "hidden",
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  fontFamily: font,
  color: "white",
}));

const UserBubble = styled(motion.div)(() => ({
  padding: "10px 16px",
  backgroundColor: NEON,
  color: "#000",
  fontWeight: 500,
  maxWidth: "78%",
  width: "fit-content",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  fontSize: "0.95rem",
  lineHeight: 1.5,
}));

const AIBubble = styled(motion.div)(() => ({
  padding: "10px 16px",
  backgroundColor: "#0d0d0d",
  border: "1px solid rgba(0,255,136,0.15)",
  color: "#e5e5e5",
  maxWidth: "82%",
  width: "fit-content",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  fontSize: "0.95rem",
  lineHeight: 1.6,
}));

// ── TYPING INDICATOR ──
const TypingIndicator = () => (
  <Box sx={{ display: "flex", gap: "5px", alignItems: "center", p: "6px 4px" }}>
    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: NEON, boxShadow: `0 0 4px ${NEON}` }} />
    {[0, 1, 2].map((dot) => (
      <motion.div
        key={dot}
        style={{ width: 6, height: 6, backgroundColor: NEON, borderRadius: "50%", opacity: 0.6 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: dot * 0.15 }}
      />
    ))}
  </Box>
);

// ── MAIN COMPONENT ──
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        const userData = await authService.getProfile();
        setUser(userData);
        const convData = await conversationService.getConversations();
        setConversations(convData.conversations || []);
        if (convData.conversations && convData.conversations.length > 0) {
          const firstConv = convData.conversations[0];
          setCurrentConversationId(firstConv._id);
          const chatHistory = await chatService.getChatHistory(firstConv._id);
          setMessages(chatHistory.chats || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const tempMessage = newMessage;
    setNewMessage("");
    const tempUserMsg = { _id: Date.now().toString(), message: tempMessage, timestamp: new Date().toISOString(), sender: "user" };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);
    try {
      const response = await chatService.sendMessage(tempMessage, currentConversationId);
      const newChat = {
        _id: response.chatId, conversationId: response.conversationId, userId: user._id,
        message: tempMessage, response: response.message, timestamp: new Date().toISOString(),
        metadata: { model: "compliance-house-agent", tokens: response.tokens },
      };
      if (!currentConversationId) {
        setCurrentConversationId(response.conversationId);
        const convData = await conversationService.getConversations();
        setConversations(convData.conversations || []);
      }
      setMessages((prev) => [...prev.filter((msg) => msg._id !== tempUserMsg._id), newChat]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempUserMsg._id));
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await conversationService.createConversation("New Conversation");
      setConversations((prev) => [newConv.conversation, ...prev]);
      setCurrentConversationId(newConv.conversation._id);
      setMessages([]);
      setDrawerOpen(false);
    } catch (error) { console.error("Error creating conversation:", error); }
  };

  const handleSelectConversation = async (convId) => {
    try {
      setCurrentConversationId(convId);
      const chatHistory = await chatService.getChatHistory(convId);
      setMessages(chatHistory.chats || []);
      setDrawerOpen(false);
    } catch (error) { console.error("Error loading conversation:", error); }
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerateResponse = async (chatId) => {
    try {
      setIsTyping(true);
      const response = await chatService.regenerateResponse(chatId);
      setMessages((prev) => prev.map((msg) => msg._id === chatId ? { ...msg, response: response.message } : msg));
    } catch (error) { console.error("Error regenerating response:", error); }
    finally { setIsTyping(false); }
  };

  const handleEditConversationTitle = async (convId) => {
    if (!editTitle.trim()) return;
    try {
      await conversationService.updateConversationTitle(convId, editTitle);
      setConversations((prev) => prev.map((conv) => conv._id === convId ? { ...conv, title: editTitle } : conv));
      setEditingConvId(null); setEditTitle("");
    } catch (error) { console.error("Error updating title:", error); }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;
    try {
      await conversationService.deleteConversation(conversationToDelete);
      setConversations((prev) => prev.filter((c) => c._id !== conversationToDelete));
      if (currentConversationId === conversationToDelete) { setCurrentConversationId(null); setMessages([]); }
      setDeleteDialogOpen(false); setConversationToDelete(null);
    } catch (error) { console.error("Error deleting conversation:", error); }
  };

  const handleLogout = async () => { await authService.logout(); navigate("/login"); };

  const handleClearHistory = async () => {
    try {
      await chatService.clearChatHistory();
      setMessages([]); setConversations([]); setCurrentConversationId(null); setDrawerOpen(false);
    } catch (error) { console.error("Error clearing history:", error); }
  };

  if (loading) return (
    <Box sx={{ height: "100vh", bgcolor: "#000", color: NEON, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: NEON }}>LOADING SYSTEM...</div>
      </div>
    </Box>
  );

  const sidebarBg = {
    background: "#0a0a0a",
    backgroundImage: "linear-gradient(to right, rgba(0,255,136,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,255,136,0.05) 1px, transparent 1px)",
    backgroundSize: "30px 30px",
  };

  return (
    <ObsidianRoot>
      {/* ── SIDEBAR DRAWER ── */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            ...sidebarBg,
            color: "white",
            width: { xs: "85vw", sm: 300 },
            maxWidth: 300,
            borderRight: `1px solid rgba(0,255,136,0.15)`,
            fontFamily: font,
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 28, height: 28, border: `1px solid ${NEON}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: NEON, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.05em" }}>CH</span>
            </Box>
            <Typography sx={{ fontFamily: font, fontWeight: 600, fontSize: "0.9rem", color: NEON, letterSpacing: "0.05em" }}>
              Compliance House
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "rgba(255,255,255,0.4)", p: 0.5 }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, py: 1.5 }}>
          <Button
            fullWidth
            startIcon={<Add />}
            onClick={handleNewConversation}
            sx={{
              fontFamily: font, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.75rem",
              color: "#000", backgroundColor: NEON, borderRadius: 0, fontWeight: 700,
              "&:hover": { backgroundColor: "#fff" },
            }}
          >
            New Conversation
          </Button>
        </Box>

        <Divider sx={{ borderColor: "rgba(0,255,136,0.1)" }} />

        <Box sx={{ flex: 1, overflowY: "auto", px: 1, "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { background: "rgba(0,255,136,0.2)" } }}>
          <Typography sx={{ px: 1, py: 1, display: "block", color: "rgba(0,255,136,0.4)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: font }}>
            Recent Conversations
          </Typography>
          <List dense>
            {conversations.map((conv) => (
              <ListItem key={conv._id} disablePadding sx={{
                mb: 0.25,
                backgroundColor: currentConversationId === conv._id ? "rgba(0,255,136,0.08)" : "transparent",
                borderLeft: currentConversationId === conv._id ? `2px solid ${NEON}` : "2px solid transparent",
                "&:hover": { backgroundColor: "rgba(0,255,136,0.05)" },
              }}>
                <ListItemButton onClick={() => handleSelectConversation(conv._id)} sx={{ borderRadius: 0, py: 0.75 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <ChatIcon sx={{ fontSize: 14, color: currentConversationId === conv._id ? NEON : "rgba(255,255,255,0.3)" }} />
                  </ListItemIcon>
                  {editingConvId === conv._id ? (
                    <TextField
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleEditConversationTitle(conv._id)}
                      onKeyPress={(e) => { if (e.key === "Enter") handleEditConversationTitle(conv._id); }}
                      variant="standard"
                      size="small"
                      autoFocus
                      InputProps={{ style: { color: "white", fontSize: "0.8rem", fontFamily: font } }}
                      sx={{ flex: 1, "& .MuiInput-underline:before": { borderBottomColor: "rgba(0,255,136,0.3)" }, "& .MuiInput-underline:after": { borderBottomColor: NEON } }}
                    />
                  ) : (
                    <ListItemText
                      primary={conv.title}
                      secondary={conv.preview}
                      primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: currentConversationId === conv._id ? 600 : 400, noWrap: true, fontFamily: font, color: "rgba(255,255,255,0.85)" }}
                      secondaryTypographyProps={{ fontSize: "0.7rem", noWrap: true, color: "rgba(255,255,255,0.3)", fontFamily: font }}
                      sx={{ flex: 1, minWidth: 0 }}
                    />
                  )}
                  <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                    <Tooltip title="Rename">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingConvId(conv._id); setEditTitle(conv.title); }} sx={{ color: "rgba(255,255,255,0.3)", p: 0.5, "&:hover": { color: NEON } }}>
                        <EditIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setConversationToDelete(conv._id); setDeleteDialogOpen(true); }} sx={{ color: "rgba(255,255,255,0.3)", p: 0.5, "&:hover": { color: "#ff4444" } }}>
                        <Delete sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ borderColor: "rgba(0,255,136,0.1)" }} />
        <List>
          <ListItem button onClick={handleClearHistory} sx={{ "&:hover": { backgroundColor: "rgba(255,68,68,0.08)" } }}>
            <ListItemIcon sx={{ color: "#ff4444", minWidth: 36 }}><DeleteForever fontSize="small" /></ListItemIcon>
            <ListItemText primary="Clear All History" primaryTypographyProps={{ fontSize: "0.8rem", fontFamily: font, color: "rgba(255,255,255,0.6)" }} />
          </ListItem>
        </List>
      </Drawer>

      {/* ── DELETE DIALOG ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { bgcolor: "#0a0a0a", color: "white", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 0, fontFamily: font } }}
      >
        <DialogTitle sx={{ fontFamily: font, fontSize: "1rem", borderBottom: "1px solid rgba(0,255,136,0.1)" }}>Delete Conversation?</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontFamily: font, fontSize: "0.9rem", color: "rgba(255,255,255,0.6)" }}>
            This will permanently delete this conversation and all its messages.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(0,255,136,0.1)", gap: 1, p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontFamily: font, color: "rgba(255,255,255,0.5)", borderRadius: 0, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.08em" }}>Cancel</Button>
          <Button onClick={handleDeleteConversation} sx={{ fontFamily: font, color: "#ff4444", borderRadius: 0, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.08em" }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ── MAIN CONTENT ── */}
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", position: "relative", overflow: "hidden" }}>

        {/* ── TOP BAR ── */}
        <Box sx={{
          display: "flex", alignItems: "center", px: 2, py: 1.5, gap: 1.5,
          backgroundColor: "#000",
          borderBottom: "1px solid rgba(0,255,136,0.12)",
          flexShrink: 0,
        }}>
          <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "rgba(255,255,255,0.5)", p: 0.75, "&:hover": { color: NEON }, borderRadius: 0 }}>
            <MenuIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <Avatar sx={{ width: 26, height: 26, bgcolor: "transparent", border: "1px solid rgba(0,255,136,0.3)" }} src={rivetLogo} alt="CH" />
            <Box>
              <Typography sx={{ fontFamily: font, fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.2 }}>Rivet Agent</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: NEON, boxShadow: `0 0 4px ${NEON}` }} />
                <Typography sx={{ fontFamily: font, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>ONLINE</Typography>
              </Box>
            </Box>
          </Box>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5, borderRadius: 0 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: NEON, color: "#000", fontFamily: font, fontSize: "0.8rem", fontWeight: 700 }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { bgcolor: "#0a0a0a", color: "white", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 0, minWidth: 160 } }}
          >
            <MenuItem onClick={handleLogout} sx={{ fontFamily: font, fontSize: "0.85rem", gap: 1, "&:hover": { backgroundColor: "rgba(0,255,136,0.08)", color: NEON } }}>
              <Logout sx={{ fontSize: 16 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>

        {/* ── MESSAGES AREA ── */}
        <Box sx={{
          flex: 1, overflowY: "auto", p: { xs: 2, sm: 3 },
          display: "flex", flexDirection: "column", gap: 2,
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(0,255,136,0.15)", borderRadius: "2px" },
        }}>

          {messages.length === 0 && !isTyping && (
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: 0.6, gap: 2 }}>
              <Box sx={{ width: 48, height: 48, border: `1px solid rgba(0,255,136,0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: NEON, fontWeight: 700, fontSize: "1rem" }}>CH</span>
              </Box>
              <Typography sx={{ fontFamily: font, color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", textAlign: "center", maxWidth: 300, letterSpacing: "0.02em" }}>
                How can I help you with NHS compliance today?
              </Typography>
            </Box>
          )}

          <AnimatePresence>
            {messages.map((msg, index) => (
              <React.Fragment key={msg._id || index}>
                {/* USER MESSAGE */}
                <Box sx={{ alignSelf: "flex-end", display: "flex", justifyContent: "flex-end", width: "100%" }}>
                  <UserBubble
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: font, fontWeight: 500, lineHeight: 1.5 }}>{msg.message}</Typography>
                    <Typography variant="caption" sx={{ display: "block", textAlign: "right", mt: 0.5, opacity: 0.5, fontSize: "0.65rem", fontFamily: font }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Typography>
                  </UserBubble>
                </Box>

                {/* AI RESPONSE */}
                {msg.response && (
                  <Box sx={{ alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 0.5, maxWidth: { xs: "95%", sm: "85%" }, width: "100%" }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Avatar sx={{ width: 22, height: 22, bgcolor: "transparent", border: `1px solid rgba(0,255,136,0.25)`, mt: 0.5, flexShrink: 0 }} src={rivetLogo} alt="CH" />
                      <AIBubble
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: "pre-line", fontFamily: font, lineHeight: 1.65 }}>{msg.response}</Typography>
                        <Typography variant="caption" sx={{ display: "block", mt: 0.75, opacity: 0.35, fontSize: "0.65rem", fontFamily: font }}>
                          Rivet Agent · {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </AIBubble>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5, ml: 3.5 }}>
                      <Tooltip title={copiedId === msg.response ? "Copied!" : "Copy"}>
                        <IconButton size="small" onClick={() => handleCopyMessage(msg.response)} sx={{ color: "rgba(255,255,255,0.25)", p: 0.5, borderRadius: 0, "&:hover": { color: NEON } }}>
                          {copiedId === msg.response ? <Check sx={{ fontSize: 13 }} /> : <ContentCopy sx={{ fontSize: 13 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Regenerate">
                        <IconButton size="small" onClick={() => handleRegenerateResponse(msg._id)} sx={{ color: "rgba(255,255,255,0.25)", p: 0.5, borderRadius: 0, "&:hover": { color: NEON } }}>
                          <Refresh sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>

          {/* TYPING BUBBLE */}
          {isTyping && (
            <Box sx={{ alignSelf: "flex-start", display: "flex", gap: 1 }}>
              <Avatar sx={{ width: 22, height: 22, bgcolor: "transparent", border: `1px solid rgba(0,255,136,0.25)`, flexShrink: 0 }} src={rivetLogo} alt="CH" />
              <Box sx={{ backgroundColor: "#0d0d0d", border: "1px solid rgba(0,255,136,0.15)", p: "4px 12px" }}>
                <TypingIndicator />
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* ── INPUT AREA ── */}
        <Box sx={{
          padding: { xs: "12px 16px", sm: "16px 24px" },
          backgroundColor: "#000",
          borderTop: "1px solid rgba(0,255,136,0.12)",
          flexShrink: 0,
        }}>
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              backgroundColor: "#0a0a0a",
              border: "1px solid rgba(0,255,136,0.2)",
              px: { xs: 1.5, sm: 2 },
              py: 1,
              transition: "border-color 0.2s",
              "&:focus-within": { borderColor: "rgba(0,255,136,0.5)" },
            }}
          >
            <TextField
              fullWidth
              placeholder="Ask anything about NHS compliance..."
              multiline
              maxRows={4}
              variant="standard"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
              }}
              InputProps={{ disableUnderline: true, style: { color: "white", fontFamily: font, fontSize: "0.95rem" } }}
              sx={{ flex: 1, "& .MuiInputBase-input": { caretColor: NEON } }}
            />
            <IconButton
              type="submit"
              disabled={!newMessage.trim() || isTyping}
              sx={{
                bgcolor: newMessage.trim() && !isTyping ? NEON : "transparent",
                color: newMessage.trim() && !isTyping ? "#000" : "rgba(255,255,255,0.2)",
                border: newMessage.trim() && !isTyping ? "none" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 0,
                width: 36, height: 36,
                transition: "all 0.2s",
                "&:hover": { bgcolor: newMessage.trim() && !isTyping ? "#fff" : "rgba(0,255,136,0.08)", color: newMessage.trim() && !isTyping ? "#000" : "rgba(255,255,255,0.3)" },
                "&:disabled": { bgcolor: "transparent", color: "rgba(255,255,255,0.1)" },
              }}
            >
              <Send sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Typography sx={{ fontFamily: font, fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em", textAlign: "center", mt: 0.75 }}>
            COMPLIANCE HOUSE · NHS AI SYSTEM v2.4.1
          </Typography>
        </Box>
      </Box>

      <style>{`
        input::placeholder, textarea::placeholder { color: #444 !important; font-family: ${font}; }
      `}</style>
    </ObsidianRoot>
  );
};

export default Chat;
