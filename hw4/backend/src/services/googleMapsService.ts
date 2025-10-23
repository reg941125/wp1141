import { Client } from '@googlemaps/google-maps-services-js';
import { config } from '../config/env';

const client = new Client({});

export class GoogleMapsService {
  private static apiKey = config.googleMapsApiKey;

  static async geocodeAddress(address: string) {
    try {
      const response = await client.geocode({
        params: {
          address: address,
          key: this.apiKey,
          region: 'tw', // Taiwan region
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('Address not found');
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      return {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  static async getPlaceDetails(placeId: string) {
    try {
      const response = await client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: ['name', 'formatted_address', 'geometry', 'photos'],
        },
      });

      const result = response.data.result;
      return {
        name: result.name,
        address: result.formatted_address,
        latitude: result.geometry?.location.lat,
        longitude: result.geometry?.location.lng,
        photos: result.photos?.map(photo => photo.photo_reference)
      };
    } catch (error) {
      console.error('Place details error:', error);
      throw new Error('Failed to get place details');
    }
  }

  static async searchNearbyPlaces(lat: number, lng: number, radius: number = 1000, type: string = 'establishment') {
    try {
      const response = await client.placesNearby({
        params: {
          location: { lat, lng },
          radius: radius,
          type: type,
          key: this.apiKey,
        },
      });

      return response.data.results.map(place => ({
        place_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        types: place.types,
        geometry: place.geometry
      }));
    } catch (error) {
      console.error('Nearby search error:', error);
      throw new Error('Failed to search nearby places');
    }
  }

  static isNearNTU(lat: number, lng: number, radiusKm: number = 2): boolean {
    // NTU coordinates (approximately)
    const ntuLat = 25.0172;
    const ntuLng = 121.5395;
    
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat - ntuLat);
    const dLng = this.toRadians(lng - ntuLng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(ntuLat)) * Math.cos(this.toRadians(lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance <= radiusKm;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
