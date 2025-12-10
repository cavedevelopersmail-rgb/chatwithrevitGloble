import axios from 'axios';

const API_BASE_URL = 'http://localhost:3010/api/chat';

const chatService = {
  sendMessage: async (message) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/send`, { message }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  getChatHistory: async (limit = 50, skip = 0) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/history`, {
      params: { limit, skip },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  deleteChat: async (chatId) => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE_URL}/${chatId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  clearChatHistory: async () => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};

export default chatService;
