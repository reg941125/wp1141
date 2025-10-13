import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import LanguageSwitcher from './LanguageSwitcher';
import { Language } from '../types/Song';

interface GlobalHeaderProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  selectedLanguage,
  onLanguageChange,
}) => {
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate('/');
  };

  const handleCustomPlaylistClick = () => {
    navigate('/custom-playlist');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '2px solid',
        borderColor: 'primary.main',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        zIndex: 1200,
        width: '100vw',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        px: { xs: 1, sm: 2, md: 3 },
        minHeight: '64px',
        maxWidth: '100%',
        width: '100%',
      }}>
        {/* Left side - Empty for spacing */}
        <Box sx={{ flex: 1 }} />

        {/* Center - Title */}
        <Box
          sx={{
            flex: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 0, // 防止 flex 項目溢出
          }}
        >
          <Button
            onClick={handleTitleClick}
            sx={{
              color: 'text.primary',
              textTransform: 'none',
              p: { xs: 0.5, sm: 1 },
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: 'rgba(255, 138, 101, 0.1)',
              },
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }, // 響應式字體大小
                '&:hover': {
                  background: 'linear-gradient(45deg, #FF7043 30%, #FF8A65 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                },
              }}
            >
              情緒歌單
            </Typography>
          </Button>
        </Box>

        {/* Right side - Custom Playlist and Language Switcher */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            minWidth: 0, // 防止 flex 項目溢出
          }}
        >
          {/* Custom Playlist Button */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlaylistAddIcon />}
            onClick={handleCustomPlaylistClick}
            sx={{
              color: 'primary.main',
              borderColor: 'primary.main',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 },
              display: { xs: 'none', sm: 'inline-flex' }, // 小螢幕時隱藏文字，只顯示圖標
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'rgba(255, 138, 101, 0.1)',
              },
            }}
          >
            自訂歌單
          </Button>

          {/* Mobile Custom Playlist Icon Button */}
          <Button
            variant="outlined"
            size="small"
            onClick={handleCustomPlaylistClick}
            sx={{
              color: 'primary.main',
              borderColor: 'primary.main',
              minWidth: 'auto',
              px: 1,
              display: { xs: 'inline-flex', sm: 'none' }, // 小螢幕時顯示
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'rgba(255, 138, 101, 0.1)',
              },
            }}
          >
            <PlaylistAddIcon fontSize="small" />
          </Button>

          {/* Language Switcher */}
          <LanguageSwitcher
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default GlobalHeader;
