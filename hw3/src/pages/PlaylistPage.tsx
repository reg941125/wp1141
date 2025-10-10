import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SongListView from '../components/SongListView';
import SongDetailDialog from '../components/SongDetailDialog';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Song, Language } from '../types/Song';

interface PlaylistPageProps {
  songs: Song[];
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const PlaylistPage: React.FC<PlaylistPageProps> = ({
  songs,
  selectedLanguage,
  onLanguageChange,
}) => {
  const navigate = useNavigate();
  const { mood } = useParams<{ mood: string }>();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const decodedMood = mood ? decodeURIComponent(mood) : '';
  const filteredSongs = songs.filter(
    song => song.mood === decodedMood && song.language === selectedLanguage
  );

  const handleSongClick = (song: Song) => {
    setSelectedSong(song);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleBack = () => {
    navigate('/');
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
        {/* Top Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              mb: 1,
            }}
          >
            {decodedMood} 歌單
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {selectedLanguage}歌曲 · 共 {filteredSongs.length} 首
          </Typography>
        </Box>

        {/* Song List */}
        {filteredSongs.length > 0 ? (
          <SongListView songs={filteredSongs} onSongClick={handleSongClick} />
        ) : (
          <Paper
            elevation={3}
            sx={{
              p: 6,
              textAlign: 'center',
              backgroundColor: 'background.paper',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              這個情緒目前沒有{selectedLanguage}歌曲
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              請嘗試切換語言或返回選擇其他情緒
            </Typography>
          </Paper>
        )}

        {/* Song Detail Dialog */}
        {selectedSong && (
          <SongDetailDialog
            song={selectedSong}
            open={dialogOpen}
            onClose={handleDialogClose}
          />
        )}
      </Container>
    </Box>
  );
};

export default PlaylistPage;

