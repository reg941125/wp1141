import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Fab,
  Alert,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  MyLocation as MyLocationIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import MapView from '../components/Map/MapView';
import FilterPanel from '../components/Map/FilterPanel';
import { Restroom, RestroomFilters } from '../types';
import { getCurrentLocation } from '../services/googleMaps';

const MapPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedRestroom, setSelectedRestroom] = useState<Restroom | null>(null);
  const [filters, setFilters] = useState<RestroomFilters>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleRestroomSelect = (restroom: Restroom | null) => {
    setSelectedRestroom(restroom);
    if (restroom) {
      navigate(`/restroom/${restroom.id}`);
    }
  };

  const handleFiltersChange = (newFilters: RestroomFilters) => {
    setFilters(newFilters);
  };

  const handleFindNearest = async () => {
    try {
      if (!userLocation) {
        const location = await getCurrentLocation();
        setUserLocation(location);
        setFilters({ ...filters, latitude: location.lat, longitude: location.lng });
      } else {
        setFilters({ ...filters, latitude: userLocation.lat, longitude: userLocation.lng });
      }
    } catch (error) {
      setLocationError('無法獲取您的位置，請檢查瀏覽器權限設定');
    }
  };

  const handleGetLocation = async () => {
    try {
      setLocationError(null);
      const location = await getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      setLocationError('無法獲取您的位置，請檢查瀏覽器權限設定');
    }
  };

  useEffect(() => {
    // 嘗試獲取用戶位置
    handleGetLocation();
  }, []);

  return (
    <Box sx={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="home"
            onClick={() => navigate('/')}
          >
            <HomeIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🗺️ 地圖瀏覽
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleGetLocation}
            title="獲取我的位置"
          >
            <MyLocationIcon />
          </IconButton>
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setFilterDrawerOpen(true)}
              title="篩選條件"
            >
              <FilterIcon />
            </IconButton>
          )}
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.username}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {locationError && (
        <Alert severity="warning" sx={{ m: 1 }}>
          {locationError}
        </Alert>
      )}

      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        overflow: 'hidden',
        width: '100%'
      }}>
        {/* 篩選面板 - 響應式寬度 */}
        <Box sx={{ 
          width: { xs: 0, sm: 0, md: 320, lg: 320 },
          minWidth: { md: 320 },
          maxWidth: { md: 320 },
          p: { xs: 0, sm: 0, md: 2 },
          overflow: 'auto', 
          borderRight: { xs: 0, md: 1 }, 
          borderColor: 'divider',
          display: { xs: 'none', sm: 'none', md: 'block' }
        }}>
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onFindNearest={handleFindNearest}
          />
        </Box>

        {/* 地圖區域 */}
        <Box sx={{ 
          flexGrow: 1, 
          position: 'relative',
          width: '100%',
          height: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 64px)' }
        }}>
          <MapView
            onRestroomSelect={handleRestroomSelect}
            selectedRestroom={selectedRestroom}
            filters={filters}
          />
          
          {/* 新增廁所按鈕 */}
          <Fab
            color="primary"
            aria-label="add restroom"
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
            onClick={() => navigate('/add-restroom')}
          >
            <AddIcon />
          </Fab>
        </Box>
      </Box>

      {/* 手機版篩選抽屜 */}
      <Drawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            height: '70vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2 
          }}>
            <Typography variant="h6">篩選條件</Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onFindNearest={() => {
              handleFindNearest();
              setFilterDrawerOpen(false);
            }}
          />
        </Box>
      </Drawer>
    </Box>
  );
};

export default MapPage;