import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Fade,
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MoodSelector from '../components/MoodSelector';
import CustomPlaylistSelector from '../components/CustomPlaylistSelector';
import { Language } from '../types/Song';

interface HomePageProps {
  moods: string[];
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  moods,
  selectedLanguage,
  onLanguageChange,
}) => {
  const navigate = useNavigate();

  const handleMoodSelect = (mood: string) => {
    navigate(`/playlist/${encodeURIComponent(mood)}`);
  };

  const handlePlaylistSelect = (playlistId: string) => {
    navigate(`/custom-playlist/${playlistId}`);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        background: 'linear-gradient(135deg, #1A1410 0%, #2D1810 100%)',
        pt: 8, // Add padding for global header
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg" sx={{ width: '100%', py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h6" color="text.secondary">
            根據你的心情，找到最適合的音樂
          </Typography>
          <Typography variant="body2" color="primary.light" sx={{ mt: 1 }}>
            當前語言：{selectedLanguage}歌曲
          </Typography>
        </Box>


        {/* Mood Selection */}
        {moods.length > 0 ? (
          <Fade in={true} timeout={1000}>
            <Box sx={{ mb: 6 }}>
              <MoodSelector
                moods={moods}
                selectedMood=""
                onMoodSelect={handleMoodSelect}
              />
            </Box>
          </Fade>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8, mb: 6 }}>
            <Typography variant="h6" color="text.secondary">
              載入歌曲中...
            </Typography>
          </Box>
        )}

        {/* Custom Playlist Selection */}
        <Fade in={true} timeout={1000}>
          <Box>
            <CustomPlaylistSelector onPlaylistSelect={handlePlaylistSelect} />
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default HomePage;

