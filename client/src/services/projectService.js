import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || '/api'}/projects`;

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const projectService = {
  list: async () => {
    const { data } = await axios.get(API_BASE_URL, { headers: authHeader() });
    return data;
  },

  create: async (name, description = '') => {
    const { data } = await axios.post(API_BASE_URL, { name, description }, { headers: authHeader() });
    return data;
  },

  get: async (id) => {
    const { data } = await axios.get(`${API_BASE_URL}/${id}`, { headers: authHeader() });
    return data;
  },

  update: async (id, patch) => {
    const { data } = await axios.put(`${API_BASE_URL}/${id}`, patch, { headers: authHeader() });
    return data;
  },

  remove: async (id) => {
    const { data } = await axios.delete(`${API_BASE_URL}/${id}`, { headers: authHeader() });
    return data;
  },

  uploadSource: async (id, file) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await axios.post(`${API_BASE_URL}/${id}/sources`, form, {
      headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteSource: async (id, sourceId) => {
    const { data } = await axios.delete(`${API_BASE_URL}/${id}/sources/${sourceId}`, { headers: authHeader() });
    return data;
  },

  chat: async (id, message, history = []) => {
    const { data } = await axios.post(`${API_BASE_URL}/${id}/chat`, { message, history }, { headers: authHeader() });
    return data;
  },
};

export default projectService;
