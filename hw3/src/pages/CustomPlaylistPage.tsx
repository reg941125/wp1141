import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import SongSelector from '../components/SongSelector';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Song, Language, CustomPlaylist } from '../types/Song';

interface CustomPlaylistPageProps {
  songs: Song[];
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const CustomPlaylistPage: React.FC<CustomPlaylistPageProps> = ({
  songs,
  selectedLanguage,
  onLanguageChange,
}) => {
  const navigate = useNavigate();
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 載入已保存的自訂歌單
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('customPlaylists');
    if (savedPlaylists) {
      try {
        const playlists = JSON.parse(savedPlaylists);
        setCustomPlaylists(playlists);
      } catch (error) {
        console.error('載入自訂歌單失敗:', error);
      }
    }
  }, []);

  // 過濾當前語言的歌曲
  const filteredSongs = songs.filter(song => song.language === selectedLanguage);

  const handleBack = () => {
    navigate('/');
  };

  const handleSelectionChange = (newSelectedSongs: Song[]) => {
    setSelectedSongs(newSelectedSongs);
  };

  const handleSavePlaylist = (playlistName: string, playlistSongs: Song[]) => {
    const newPlaylist: CustomPlaylist = {
      id: Date.now().toString(),
      name: playlistName,
      songs: playlistSongs,
      createdAt: new Date(),
    };

    const updatedPlaylists = [...customPlaylists, newPlaylist];
    setCustomPlaylists(updatedPlaylists);

    // 保存到 localStorage
    try {
      localStorage.setItem('customPlaylists', JSON.stringify(updatedPlaylists));
      setSuccessMessage(`歌單「${playlistName}」建立成功！`);
      setShowSuccess(true);
    } catch (error) {
      console.error('保存歌單失敗:', error);
      setSuccessMessage('保存歌單失敗，請重試');
      setShowSuccess(true);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #1A1410 0%, #2D1810 100%)',
      }}
    >
      {/* Top Bar */}
      <Container maxWidth="xl" sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
          <IconButton
            onClick={handleBack}
            sx={{
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(255, 138, 101, 0.1)',
              },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 32 }} />
          </IconButton>
          <LanguageSwitcher
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
          />
        </Box>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PlaylistAddIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography
              variant="h3"
              component="h1"
              sx={{
                background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
              }}
            >
              自訂歌單
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary">
            {selectedLanguage}歌曲 · 共 {filteredSongs.length} 首可選擇
          </Typography>
        </Box>

        {/* Main Content */}
        <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
          <SongSelector
            songs={filteredSongs}
            selectedSongs={selectedSongs}
            onSelectionChange={handleSelectionChange}
            onSavePlaylist={handleSavePlaylist}
          />
        </Box>

        {/* 已建立的自訂歌單 */}
        {customPlaylists.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" color="text.primary" gutterBottom>
              已建立的自訂歌單
            </Typography>
            <Grid container spacing={2}>
              {customPlaylists.map((playlist) => (
                <Grid item xs={12} sm={6} md={4} key={playlist.id}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      backgroundColor: 'background.paper',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 138, 101, 0.05)',
                      },
                    }}
                    onClick={() => {
                      // 導航到自訂歌單播放頁面
                      navigate(`/custom-playlist/${playlist.id}`);
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                      {playlist.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {playlist.songs.length} 首歌曲
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      建立於 {new Date(playlist.createdAt).toLocaleDateString('zh-TW')}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomPlaylistPage;
