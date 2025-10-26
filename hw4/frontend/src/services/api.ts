import axios from 'axios';
import { 
  User, 
  UserCreate, 
  UserLogin, 
  Restroom, 
  RestroomCreate, 
  RestroomUpdate, 
  RestroomFilters,
  Comment, 
  CommentCreate, 
  RatingCreate, 
  Friendship, 
  FriendRequest,
  ApiResponse 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData: UserCreate): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: UserLogin): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Restroom API
export const restroomAPI = {
  getAll: async (filters?: RestroomFilters): Promise<ApiResponse<Restroom[]>> => {
    const response = await api.get('/restrooms', { params: filters });
    return response.data;
  },

  getNearby: async (lat: number, lng: number, radius?: number): Promise<ApiResponse<Restroom[]>> => {
    const response = await api.get('/restrooms/nearby', {
      params: { lat, lng, radius }
    });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Restroom>> => {
    const response = await api.get(`/restrooms/${id}`);
    return response.data;
  },

  create: async (restroomData: RestroomCreate): Promise<ApiResponse<Restroom>> => {
    const response = await api.post('/restrooms', restroomData);
    return response.data;
  },

  update: async (id: number, updateData: RestroomUpdate): Promise<ApiResponse<Restroom>> => {
    const response = await api.put(`/restrooms/${id}`, updateData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/restrooms/${id}`);
    return response.data;
  },
};

// Comment API
export const commentAPI = {
  getByRestroom: async (restroomId: number): Promise<ApiResponse<Comment[]>> => {
    const response = await api.get(`/comments/restroom/${restroomId}`);
    return response.data;
  },

  add: async (restroomId: number, commentData: CommentCreate): Promise<ApiResponse<Comment>> => {
    const response = await api.post(`/comments/restroom/${restroomId}`, commentData);
    return response.data;
  },

  delete: async (commentId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  rate: async (restroomId: number, ratingData: RatingCreate): Promise<ApiResponse<null>> => {
    const response = await api.post(`/comments/restroom/${restroomId}/rate`, ratingData);
    return response.data;
  },
};

// Friend API
export const friendAPI = {
  getFriends: async (): Promise<ApiResponse<Friendship[]>> => {
    const response = await api.get('/friends');
    return response.data;
  },

  getRequests: async (): Promise<ApiResponse<{ incoming: Friendship[]; outgoing: Friendship[] }>> => {
    const response = await api.get('/friends/requests');
    return response.data;
  },

  sendRequest: async (requestData: FriendRequest): Promise<ApiResponse<null>> => {
    const response = await api.post('/friends/request', requestData);
    return response.data;
  },

  acceptRequest: async (requestId: number): Promise<ApiResponse<null>> => {
    const response = await api.put(`/friends/accept/${requestId}`);
    return response.data;
  },

  removeFriend: async (friendId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },

  getActivity: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/friends/activity');
    return response.data;
  },

  searchUsers: async (query: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/friends/search', { params: { q: query } });
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file: File): Promise<ApiResponse<{ url: string; filename: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(
      `${API_BASE_URL}/upload/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    
    return response.data;
  },
};

export default api;
