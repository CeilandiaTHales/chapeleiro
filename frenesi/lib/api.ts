// Simple API wrapper
const API_URL = '/api'; // Nginx proxies this to backend:3000

const getHeaders = () => {
  const token = localStorage.getItem('irondb_token');
  // Return headers even if no token, let backend decide if it's public
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  get: async (endpoint: string) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { headers: getHeaders() });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (e) {
      console.error(`API Error ${endpoint}:`, e);
      return null;
    }
  },

  post: async (endpoint: string, body: any) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || res.statusText);
      }
      return await res.json();
    } catch (e: any) {
      console.error(`API Error ${endpoint}:`, e);
      throw e;
    }
  }
};