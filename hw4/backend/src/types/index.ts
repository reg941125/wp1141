// User types
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Restroom types
export interface Restroom {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  creator_id: number;
  picture_url?: string;
  created_at: string;
  creator?: User;
  tags?: RestroomTag[];
  comments?: Comment[];
  ratings?: Rating[];
  average_rating?: number;
}

export interface RestroomCreate {
  name: string;
  address: string;
  description?: string;
  picture_url?: string;
  tags?: RestroomTagCreate[];
}

export interface RestroomUpdate {
  name?: string;
  address?: string;
  description?: string;
  picture_url?: string;
}

// Tag types
export interface RestroomTag {
  id: number;
  restroom_id: number;
  tag_type: 'bidet' | 'smell' | 'lighting' | 'accessible' | 'tissue_supply' | 'open_24h';
  tag_value: string;
}

export interface RestroomTagCreate {
  tag_type: 'bidet' | 'smell' | 'lighting' | 'accessible' | 'tissue_supply' | 'open_24h';
  tag_value: string;
}

// Comment types
export interface Comment {
  id: number;
  restroom_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: User;
}

export interface CommentCreate {
  content: string;
}

// Rating types
export interface Rating {
  id: number;
  restroom_id: number;
  user_id: number;
  rating: number;
  created_at: string;
}

export interface RatingCreate {
  rating: number;
}

// Friend types
export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted';
  created_at: string;
  friend?: User;
}

export interface FriendRequest {
  friend_id: number;
}

// Filter types
export interface RestroomFilters {
  bidet?: boolean;
  smell?: 'good' | 'neutral' | 'bad';
  lighting?: 'bright' | 'dim';
  accessible?: boolean;
  tissue_supply?: boolean;
  open_24h?: boolean;
  min_rating?: number;
  radius?: number; // in kilometers
  latitude?: number;
  longitude?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}
