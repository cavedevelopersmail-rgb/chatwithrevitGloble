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
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";
import {
  Send,
  Menu as MenuIcon,
  Logout,
  Person,
  Chat as ChatIcon,
  Close,
  DeleteForever,
  SmartToy,
  ContentCopy,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { styled } from "@mui/material/styles";
import authService from "../../services/authService";
import chatService from "../../services/chatService";
import rivetLogo from "../../assets/rivetGlobalpng.png";

// --- STYLED COMPONENTS FOR "OSM" AESTHETIC ---

const GradientBackground = styled(Box)({
  background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  height: "100vh",
  display: "flex",
  overflow: "hidden",
  position: "relative",
});

const GlassPaper = styled(Paper)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
  color: "white",
}));

const MessageBubble = styled(motion.div)(({ isUser }) => ({
  padding: "12px 18px",
  borderRadius: isUser ? "20px 20px 0px 20px" : "20px 20px 20px 0px",
  background: isUser
    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" // User: Purple Gradient
    : "rgba(255, 255, 255, 0.1)", // AI: Glass effect
  backdropFilter: isUser ? "none" : "blur(5px)",
  color: "#fff",
  maxWidth: "80%",
  position: "relative",
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  marginBottom: "8px",
  border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
}));

const InputArea = styled(Box)({
  padding: "20px",
  background: "rgba(0, 0, 0, 0.3)",
  backdropFilter: "blur(10px)",
  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  display: "flex",
  alignItems: "center",
  gap: "10px",
});

// --- TYPING INDICATOR COMPONENT ---
const TypingIndicator = () => (
  <Box
    sx={{ display: "flex", gap: "5px", padding: "10px", alignItems: "center" }}
  >
    <SmartToy sx={{ color: "#a8c0ff", mr: 1, fontSize: 18 }} />
    {[0, 1, 2].map((dot) => (
      <motion.div
        key={dot}
        style={{
          width: "8px",
          height: "8px",
          backgroundColor: "#a8c0ff",
          borderRadius: "50%",
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: dot * 0.2,
        }}
      />
    ))}
  </Box>
);

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false); // State for animation
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const userData = await authService.getProfile();
        setUser(userData);
        const chatHistory = await chatService.getChatHistory();
        setMessages(chatHistory.chats || []);
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
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMessage = newMessage;
    setNewMessage("");

    // Optimistic UI: Add user message immediately
    const tempUserMsg = {
      _id: Date.now().toString(), // Temporary ID
      message: tempMessage,
      timestamp: new Date().toISOString(),
      sender: "user", // Flag to identify locally
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true); // Start typing animation

    try {
      const response = await chatService.sendMessage(tempMessage);

      const newChat = {
        _id: response.chatId,
        userId: user._id,
        message: tempMessage,
        response: response.message,
        timestamp: new Date().toISOString(),
        metadata: { model: "gpt-3.5-turbo", tokens: response.tokens },
      };

      // Replace the temp message and add response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg._id !== tempUserMsg._id);
        return [...filtered, newChat];
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsTyping(false); // Stop typing animation
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const handleClearHistory = async () => {
    await chatService.clearChatHistory();
    setMessages([]);
    setDrawerOpen(false);
  };

  if (loading)
    return (
      <Box
        sx={{
          height: "100vh",
          bgcolor: "#0f0c29",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </Box>
    );

  return (
    <GradientBackground>
      {/* --- SIDEBAR DRAWER (Glassmorphism) --- */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            background: "rgba(15, 12, 41, 0.95)",
            backdropFilter: "blur(20px)",
            color: "white",
            width: 280,
            borderRight: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <Box
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h5"
            fontWeight="900"
            sx={{
              background: "linear-gradient(to right, #a8c0ff, #3f2b96)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Rivet AI
          </Typography>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ color: "rgba(255,255,255,0.7)" }}
          >
            <Close />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
        <List>
          <ListItem
            button
            onClick={handleClearHistory}
            sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
          >
            <ListItemIcon sx={{ color: "#ff6b6b" }}>
              <DeleteForever />
            </ListItemIcon>
            <ListItemText primary="Clear Memory" />
          </ListItem>
        </List>
      </Drawer>

      {/* --- MAIN CONTENT --- */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          height: "100%",
          position: "relative",
        }}
      >
        {/* --- NAVBAR --- */}
        <AppBar
          position="static"
          sx={{
            background: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(10px)",
            boxShadow: "none",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Avatar
              sx={{
                bgcolor: "transparent",
                mr: 1,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
              src={rivetLogo}
              alt="Rivet Global"
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Rivet Agent
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#00ff88",
                    boxShadow: "0 0 5px #00ff88",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Online
                </Typography>
              </Box>
            </Box>
            <IconButton
              color="inherit"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#667eea" }}>
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  bgcolor: "#24243e",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.1)",
                },
              }}
            >
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1, fontSize: 18 }} /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* --- CHAT AREA --- */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255,255,255,0.1)",
              borderRadius: "3px",
            },
          }}
        >
          {messages.length === 0 && !isTyping && (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                opacity: 0.7,
              }}
            >
              <SmartToy
                sx={{ fontSize: 60, color: "rgba(255,255,255,0.2)", mb: 2 }}
              />
              <Typography color="rgba(255,255,255,0.5)">
                How can I help you with Healthcare today?
              </Typography>
            </Box>
          )}

          <AnimatePresence>
            {messages.map((msg, index) => (
              <React.Fragment key={msg._id || index}>
                {/* USER MESSAGE */}
                <Box
                  sx={{
                    alignSelf: "flex-end",
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                  }}
                >
                  <MessageBubble
                    isUser={true}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography variant="body1">{msg.message}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        textAlign: "right",
                        mt: 1,
                        opacity: 0.7,
                        fontSize: "0.7rem",
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </MessageBubble>
                </Box>

                {/* AI RESPONSE */}
                {msg.response && (
                  <Box
                    sx={{
                      alignSelf: "flex-start",
                      display: "flex",
                      gap: 1,
                      maxWidth: "90%",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "rgba(255,255,255,0.1)",
                        mt: 1,
                      }}
                      src={rivetLogo}
                      alt="Rivet Global"
                    />
                    <MessageBubble
                      isUser={false}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {msg.response}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mt: 1,
                          opacity: 0.5,
                          fontSize: "0.7rem",
                        }}
                      >
                        AI Assistant •{" "}
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </MessageBubble>
                  </Box>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>

          {/* TYPING ANIMATION BUBBLE */}
          {isTyping && (
            <Box sx={{ alignSelf: "flex-start", display: "flex", gap: 1 }}>
              <Avatar
                sx={{ width: 28, height: 28, bgcolor: "rgba(255,255,255,0.1)" }}
                src={rivetLogo}
                alt="Rivet Global"
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{
                  bgcolor: "rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                  p: 1,
                }}
              >
                <GlassPaper sx={{ borderRadius: "20px 20px 20px 5px", px: 1 }}>
                  <TypingIndicator />
                </GlassPaper>
              </motion.div>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* --- INPUT AREA --- */}
        <InputArea>
          <GlassPaper
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              p: "4px 15px",
              display: "flex",
              alignItems: "center",
              width: "100%",
              borderRadius: "30px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "0.3s",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.12)",
                borderColor: "#a8c0ff",
              },
            }}
          >
            <TextField
              fullWidth
              placeholder="Ask anything..."
              variant="standard"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              InputProps={{ disableUnderline: true, style: { color: "white" } }}
              sx={{ ml: 1, flex: 1 }}
            />
            {/* --- UPDATED SEND BUTTON BELOW --- */}
            <IconButton
              type="submit"
              disabled={!newMessage.trim() || isTyping}
              sx={{
                // CHANGED: Purple (#667eea) -> Green (#00e676)
                bgcolor: newMessage.trim()
                  ? "#00e676"
                  : "rgba(255,255,255,0.1)",
                color: "white",
                transition: "0.2s",
                // CHANGED: Hover Purple (#764ba2) -> Darker Green (#00a152)
                "&:hover": { bgcolor: "#00a152", transform: "scale(1.1)" },
              }}
            >
              <Send fontSize="small" />
            </IconButton>
          </GlassPaper>
        </InputArea>
      </Box>
    </GradientBackground>
  );
};

export default Chat;
