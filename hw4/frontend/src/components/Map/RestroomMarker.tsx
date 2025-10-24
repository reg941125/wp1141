import React, { useState } from 'react';
import { Marker } from '@react-google-maps/api';
import { InfoWindow } from '@react-google-maps/api';
import { Box, Typography, Chip, Rating } from '@mui/material';
import { Restroom } from '../../types';
import { getMarkerSize } from '../../services/googleMaps';

interface RestroomMarkerProps {
  restroom: Restroom;
  onClick: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  isSelected?: boolean;
}

const RestroomMarker: React.FC<RestroomMarkerProps> = ({ 
  restroom, 
  onClick,
  onHover,
  onLeave
}) => {
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  const handleMarkerClick = () => {
    setShowInfoWindow(true);
    onClick();
  };

  const handleInfoWindowClose = () => {
    setShowInfoWindow(false);
  };

  const markerSize = getMarkerSize(restroom.average_rating);

  return (
    <>
      <Marker
        position={{ lat: restroom.latitude, lng: restroom.longitude }}
        onClick={handleMarkerClick}
        onMouseOver={onHover}
        onMouseOut={onLeave}
        icon={{
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="${markerSize.width}" height="${markerSize.height}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#1976d2"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(markerSize.width, markerSize.height),
          anchor: new google.maps.Point(markerSize.width / 2, markerSize.height),
        }}
      />
      
      {showInfoWindow && (
        <InfoWindow
          position={{ lat: restroom.latitude, lng: restroom.longitude }}
          onCloseClick={handleInfoWindowClose}
        >
          <Box sx={{ p: 1, minWidth: 200 }}>
            <Typography variant="h6" gutterBottom>
              {restroom.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {restroom.address}
            </Typography>
            
            {restroom.average_rating && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating 
                  value={restroom.average_rating} 
                  readOnly 
                  size="small"
                />
                <Typography variant="caption" sx={{ ml: 1 }}>
                  ({restroom.average_rating.toFixed(1)})
                </Typography>
              </Box>
            )}
            
            {restroom.tags && restroom.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {restroom.tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag.tag_value}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {restroom.tags.length > 3 && (
                  <Chip
                    label={`+${restroom.tags.length - 3}`}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
            
            <Typography variant="caption" color="text.secondary">
              Click for details
            </Typography>
          </Box>
        </InfoWindow>
      )}
    </>
  );
};

export default RestroomMarker;
