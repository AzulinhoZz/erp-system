import api from './api';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data; // { accessToken, refreshToken, user, company }
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
