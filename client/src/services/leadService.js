import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || '/api'}/leads`;

const leadService = {
  submit: async (payload) => {
    const { data } = await axios.post(API_BASE_URL, payload);
    return data;
  },
};

export default leadService;
