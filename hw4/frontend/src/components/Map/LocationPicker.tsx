import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Box, Typography, CircularProgress } from '@mui/material';
import { GOOGLE_MAPS_CONFIG, DEFAULT_MAP_OPTIONS, NTU_COORDINATES } from '../../services/googleMaps';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  onLocationSelect, 
  selectedLocation 
}) => {
  const [mapCenter] = useState(NTU_COORDINATES);
  const [mapZoom] = useState(15);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.apiKey,
    libraries: ['places', 'geometry'],
  });

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      onLocationSelect(location);
    }
  }, [onLocationSelect]);

  if (loadError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography color="error">
          Error loading Google Maps. Please check your API key.
        </Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading map...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '400px', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={mapZoom}
        options={DEFAULT_MAP_OPTIONS}
        onClick={handleMapClick}
      >
        {selectedLocation && (
          <Marker
            position={selectedLocation}
            title="選擇的位置"
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#1976d2"/>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 32),
            }}
          />
        )}
      </GoogleMap>
      
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: 1,
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          點擊地圖選擇位置
        </Typography>
      </Box>
    </Box>
  );
};

export default LocationPicker;
