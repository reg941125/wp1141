import { MapLocation } from '../types';

// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry'] as const,
  region: 'TW' as const,
  language: 'zh-TW' as const,
};

// NTU coordinates
export const NTU_COORDINATES: MapLocation = {
  lat: 25.0172,
  lng: 121.5395,
};

// Default map options
export const DEFAULT_MAP_OPTIONS = {
  zoom: 15,
  center: NTU_COORDINATES,
  mapTypeId: 'roadmap' as const,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: true,
  fullscreenControl: true,
};

// Map bounds for NTU area
export const NTU_BOUNDS = {
  north: 25.03,
  south: 25.00,
  east: 121.55,
  west: 121.52,
};

// Calculate distance between two points
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Check if location is within NTU area
export const isWithinNTUArea = (
  lat: number,
  lng: number,
  radiusKm: number = 2
): boolean => {
  const distance = calculateDistance(lat, lng, NTU_COORDINATES.lat, NTU_COORDINATES.lng);
  return distance <= radiusKm;
};

// Get current user location
export const getCurrentLocation = (): Promise<MapLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: MapLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        resolve(location);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
};

// Format address for display
export const formatAddress = (address: string): string => {
  // Remove Taiwan country code if present
  return address.replace(/, Taiwan$/, '').replace(/, ROC$/, '');
};

// Get marker icon based on rating
export const getMarkerIcon = (rating?: number): string => {
  if (!rating) return '🔴'; // Default red marker
  
  if (rating >= 4.5) return '🟢'; // Green for excellent
  if (rating >= 3.5) return '🟡'; // Yellow for good
  if (rating >= 2.5) return '🟠'; // Orange for average
  return '🔴'; // Red for poor
};

// Get marker emoji based on rating
export const getMarkerEmoji = (rating?: number): string => {
  if (!rating) return '🚽'; // Default toilet emoji
  
  if (rating >= 4.5) return '🚽✨'; // Excellent toilet
  if (rating >= 3.5) return '🚽👍'; // Good toilet
  if (rating >= 2.5) return '🚽'; // Average toilet
  return '🚽⚠️'; // Poor toilet
};

// Get marker size based on rating
export const getMarkerSize = (rating?: number): { width: number; height: number } => {
  if (!rating) return { width: 30, height: 30 };
  
  if (rating >= 4.5) return { width: 35, height: 35 }; // Larger for excellent
  if (rating >= 3.5) return { width: 32, height: 32 }; // Medium for good
  return { width: 30, height: 30 }; // Default size
};
