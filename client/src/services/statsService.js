import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || '/api'}/conversations`;

const statsService = {
  getOverview: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/stats/overview`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

export default statsService;
