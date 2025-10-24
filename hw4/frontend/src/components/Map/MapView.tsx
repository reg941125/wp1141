import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Box, Typography, CircularProgress } from '@mui/material';
import { GOOGLE_MAPS_CONFIG, DEFAULT_MAP_OPTIONS, NTU_COORDINATES } from '../../services/googleMaps';
import { Restroom } from '../../types';
import { restroomAPI } from '../../services/api';
import RestroomMarker from './RestroomMarker';
import RestroomPreview from './RestroomPreview';

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
  const [hoveredRestroom, setHoveredRestroom] = useState<Restroom | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<google.maps.Map | null>(null);

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

  const handleMarkerHover = (restroom: Restroom) => {
    setHoveredRestroom(restroom);
    
    if (!mapRef.current) return;
    
    // 使用 marker 的經緯度位置來計算預覽位置
    const markerLatLng = new google.maps.LatLng(restroom.latitude, restroom.longitude);
    
    // 計算預覽卡片的最佳位置
    const cardWidth = 350; // 預覽卡片寬度
    const cardHeight = 200; // 預覽卡片高度（估算）
    const margin = 20; // 邊距
    
    // 使用 Google Maps 投影將經緯度轉換為像素位置
    const projection = mapRef.current.getProjection();
    if (!projection) return;
    
    const markerPixel = projection.fromLatLngToPoint(markerLatLng);
    if (!markerPixel) return;
    
    const mapBounds = mapRef.current.getBounds();
    const topRight = mapBounds?.getNorthEast();
    const bottomLeft = mapBounds?.getSouthWest();
    
    if (!topRight || !bottomLeft) return;
    
    const topRightPixel = projection.fromLatLngToPoint(topRight);
    const bottomLeftPixel = projection.fromLatLngToPoint(bottomLeft);
    
    if (!topRightPixel || !bottomLeftPixel) return;
    
    // 計算相對於地圖容器的像素位置
    const mapDiv = mapRef.current.getDiv();
    const mapWidth = mapDiv.offsetWidth;
    const mapHeight = mapDiv.offsetHeight;
    
    const scale = Math.pow(2, mapRef.current.getZoom() || 15);
    const pixelCoordinate = new google.maps.Point(
      markerPixel.x * scale,
      markerPixel.y * scale
    );
    
    // 轉換為相對於地圖容器的位置
    const markerX = (pixelCoordinate.x - bottomLeftPixel.x * scale) * mapWidth / ((topRightPixel.x - bottomLeftPixel.x) * scale);
    const markerY = (pixelCoordinate.y - bottomLeftPixel.y * scale) * mapHeight / ((topRightPixel.y - bottomLeftPixel.y) * scale);
    
    let x = markerX + margin;
    let y = markerY - margin;
    
    // 檢查右邊界
    if (x + cardWidth > mapWidth) {
      x = markerX - cardWidth - margin; // 顯示在左邊
    }
    
    // 檢查上邊界
    if (y - cardHeight < 0) {
      y = markerY + margin; // 顯示在下面
    }
    
    setPreviewPosition({ x, y });
  };

  const handleMarkerLeave = () => {
    setHoveredRestroom(null);
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
      height: '100%', 
      position: 'relative',
      minHeight: 'calc(100vh - 64px)'
    }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={mapZoom}
        options={DEFAULT_MAP_OPTIONS}
        onClick={handleMapClick}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {restrooms.map((restroom) => (
          <RestroomMarker
            key={restroom.id}
            restroom={restroom}
            onClick={() => handleMarkerClick(restroom)}
            onHover={() => handleMarkerHover(restroom)}
            onLeave={handleMarkerLeave}
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

      {/* 廁所預覽 */}
      <RestroomPreview
        restroom={hoveredRestroom!}
        visible={!!hoveredRestroom}
        position={previewPosition}
      />
    </Box>
  );
};

export default MapView;
