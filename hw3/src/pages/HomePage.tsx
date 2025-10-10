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
import LanguageSwitcher from '../components/LanguageSwitcher';
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A1410 0%, #2D1810 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Language Switcher */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <LanguageSwitcher
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
          />
        </Box>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <MusicNoteIcon sx={{ fontSize: 48, color: 'primary.main', mr: 2 }} />
            <Typography
              variant="h2"
              component="h1"
              sx={{
                background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
              }}
            >
              情緒歌單
            </Typography>
          </Box>
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
            <Box sx={{ mb: 4 }}>
              <MoodSelector
                moods={moods}
                selectedMood=""
                onMoodSelect={handleMoodSelect}
              />
            </Box>
          </Fade>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              載入歌曲中...
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default HomePage;

