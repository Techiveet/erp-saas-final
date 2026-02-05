import axios, { AxiosError } from 'axios';

// --- Configuration ---
const isServer = typeof window === 'undefined';
const API_URL = isServer
  ? (process.env.INTERNAL_API_URL || 'http://backend:8000/api')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');

const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

// --- Axios Instance ---
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// --- ✅ NEW: Request Interceptor (Fixes the Loop) ---
// This injects the 'hive_token' into every request so the backend knows who you are.
api.interceptors.request.use((config) => {
  if (!isServer) {
    const token = localStorage.getItem('hive_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Handle CSRF mismatch (419)
    if (error.response?.status === 419 && originalRequest) {
      try {
        await initializeCsrf();
        return api(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    // Handle Session Expiry (401)
    if (error.response?.status === 401 && !isServer && !window.location.pathname.startsWith('/sign-in')) {
      // Optional: Clear token on 401 to prevent stale state
      localStorage.removeItem('hive_token');
      window.location.href = '/sign-in?error=SessionExpired';
    }
    
    return Promise.reject(error);
  }
);

// --- 1. Authentication API ---
export const initializeCsrf = async () => {
  await axios.get(`${BACKEND_URL}/sanctum/csrf-cookie`, {
    baseURL: API_URL,
    withCredentials: true,
  });
};

export const login = async (credentials: Record<string, any>) => {
  await initializeCsrf();
  const { data } = await api.post('/login', credentials);
  return data;
};

export const logout = async () => {
  try {
    await api.post('/logout');
  } finally {
    if (!isServer) {
      localStorage.removeItem("hive_token");
      localStorage.removeItem("user_data"); // Good practice to clear user data too
      window.location.href = '/sign-in';
    }
  }
};

export const getProfile = async () => {
  const { data } = await api.get('/user');
  return data;
};

export const checkAuth = getProfile; 

// --- 2. Users API ---
export const fetchUsers = async (params: any) => {
  const { data } = await api.get('/users', { params });
  return data;
};

export const createUser = async (formData: FormData) => {
  const { data } = await api.post('/users', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateUser = async ({ id, formData }: { id: number; formData: FormData }) => {
  formData.append('_method', 'PUT'); 
  const { data } = await api.post(`/users/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteUser = async (id: number) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const toggleUserStatus = async (id: number) => {
  const { data } = await api.post(`/users/${id}/toggle-status`);
  return data;
};

// --- 3. Roles API ---
export const fetchRoles = async (tenantId?: string | null) => {
  const { data } = await api.get('/roles', { params: { tenant_id: tenantId } });
  return data;
};

export const createRole = async (payload: any) => {
  const { data } = await api.post('/roles', payload);
  return data;
};

export const updateRole = async ({ id, payload }: { id: number; payload: any }) => {
  const { data } = await api.put(`/roles/${id}`, payload);
  return data;
};

export const deleteRole = async (id: number) => {
  const { data } = await api.delete(`/roles/${id}`);
  return data;
};

// --- 4. Permissions API ---
export const fetchPermissions = async (params: any) => {
  const { data } = await api.get('/permissions', { params });
  return data;
};

export const createPermission = async (payload: any) => {
  const { data } = await api.post('/permissions', payload);
  return data;
};

export const updatePermission = async ({ id, payload }: { id: number; payload: any }) => {
  const { data } = await api.put(`/permissions/${id}`, payload);
  return data;
};

export const deletePermission = async (id: number) => {
  const { data } = await api.delete(`/permissions/${id}`);
  return data;
};

export const bulkDeletePermissions = async (ids: (string | number)[]) => {
  const { data } = await api.delete('/permissions/bulk', { data: { ids } });
  return data;
};

export default api;