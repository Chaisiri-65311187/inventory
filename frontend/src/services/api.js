import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

export const loginRequest = async (username, password) => {
  const res = await api.post('/api/login', { username, password });
  return res.data; // { user }
};

export default api;
