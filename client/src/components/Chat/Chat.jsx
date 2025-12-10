import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, TextField, IconButton,
  List, ListItem, ListItemText, Divider, AppBar,
  Toolbar, Avatar, Menu, MenuItem, Drawer, ListItemIcon
} from '@mui/material';
import {
  Send, Menu as MenuIcon, Logout, Delete, Person,
  Chat as ChatIcon, Settings, Close, DeleteForever
} from '@mui/icons-material';
import authService from '../../services/authService';
import chatService from '../../services/chatService';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const userData = await authService.getProfile();
        setUser(userData);

        const chatHistory = await chatService.getChatHistory();
        setMessages(chatHistory.chats || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await chatService.sendMessage(newMessage);
      const newChat = {
        _id: response.chatId,
        userId: user._id,
        message: newMessage,
        response: response.message,
        timestamp: new Date().toISOString(),
        metadata: {
          model: 'gpt-3.5-turbo',
          tokens: response.tokens
        }
      };

      setMessages([...messages, newChat]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await chatService.deleteChat(chatId);
      setMessages(messages.filter(msg => msg._id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatService.clearChatHistory();
      setMessages([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f5' }}>
      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
            bgcolor: '#128C7E',
            color: 'white'
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Chat App</Typography>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

        <List>
          <ListItem button>
            <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText primary="Chats" />
          </ListItem>
          <ListItem button onClick={handleClearHistory}>
            <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
              <DeleteForever />
            </ListItemIcon>
            <ListItemText primary="Clear History" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Chat Area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* App Bar */}
        <AppBar position="static" sx={{ bgcolor: '#128C7E', height: 64 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Chat with AI
            </Typography>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <Person />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: '#e5ddd5',
            backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b33e9e1e1e1e1e1e1e.png")',
            backgroundSize: 'cover'
          }}
        >
          {messages.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="textSecondary">No messages yet. Start a conversation!</Typography>
            </Box>
          ) : (
            <List>
              {messages.map((msg, index) => (
                <React.Fragment key={msg._id || index}>
                  {/* User Message */}
                  <ListItem sx={{ justifyContent: 'flex-end', mb: 1 }}>
                    <Box sx={{
                      maxWidth: '70%',
                      bgcolor: '#DCF8C6',
                      borderRadius: '7.5px',
                      p: 1.5,
                      position: 'relative'
                    }}>
                      <Typography variant="body1">{msg.message}</Typography>
                      <Typography variant="caption" display="block" textAlign="right" color="textSecondary">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteChat(msg._id)}
                      sx={{ ml: 1, color: 'error.main' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItem>

                  {/* AI Response */}
                  <ListItem sx={{ justifyContent: 'flex-start', mb: 2 }}>
                    <Box sx={{
                      maxWidth: '70%',
                      bgcolor: 'white',
                      borderRadius: '7.5px',
                      p: 1.5,
                      position: 'relative'
                    }}>
                      <Typography variant="body1">{msg.response}</Typography>
                      <Typography variant="caption" display="block" textAlign="left" color="textSecondary">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>

        {/* Message Input */}
        <Paper
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            borderTop: '1px solid #ddd',
            bgcolor: '#f0f2f5'
          }}
        >
          <TextField
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={{
              ml: 1,
              flex: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'transparent',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'transparent',
                },
              },
            }}
          />
          <IconButton type="submit" color="primary" sx={{ p: '10px' }}>
            <Send />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
};

export default Chat;
