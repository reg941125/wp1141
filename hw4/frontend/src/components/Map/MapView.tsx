import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Box, Typography, CircularProgress } from '@mui/material';
import { GOOGLE_MAPS_CONFIG, DEFAULT_MAP_OPTIONS, NTU_COORDINATES } from '../../services/googleMaps';
import { Restroom } from '../../types';
import { restroomAPI } from '../../services/api';
import RestroomMarker from './RestroomMarker';

interface MapViewProps {
  onRestroomSelect?: (restroom: Restroom) => void;
  selectedRestroom?: Restroom | null;
  filters?: any;
}

const MapView: React.FC<MapViewProps> = ({ 
  onRestroomSelect, 
  selectedRestroom, 
  filters 
}) => {
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter] = useState(NTU_COORDINATES);
  const [mapZoom] = useState(15);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.apiKey,
    libraries: ['places', 'geometry'],
  });

  const fetchRestrooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await restroomAPI.getAll(filters);
      if (response.success && response.data) {
        setRestrooms(response.data);
      } else {
        setError('Failed to fetch restrooms');
      }
    } catch (err) {
      setError('Error loading restrooms');
      console.error('Error fetching restrooms:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (isLoaded) {
      fetchRestrooms();
    }
  }, [isLoaded, fetchRestrooms]);

  const handleMarkerClick = (restroom: Restroom) => {
    if (onRestroomSelect) {
      onRestroomSelect(restroom);
    }
  };

  const handleMapClick = () => {
    // Map click handler - could be used for future features
  };

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
    <Box sx={{ 
      width: '100%', 
      height: { xs: 'calc(100vh - 64px)', sm: 'calc(100vh - 64px)', md: '500px' }, 
      position: 'relative' 
    }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={mapZoom}
        options={DEFAULT_MAP_OPTIONS}
        onClick={handleMapClick}
      >
        {restrooms.map((restroom) => (
          <RestroomMarker
            key={restroom.id}
            restroom={restroom}
            onClick={() => handleMarkerClick(restroom)}
            isSelected={selectedRestroom?.id === restroom.id}
          />
        ))}
      </GoogleMap>
      
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'white',
            padding: 1,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="caption" sx={{ ml: 1 }}>
            Loading restrooms...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'error.light',
            color: 'white',
            padding: 1,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption">{error}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default MapView;
