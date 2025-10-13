import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SongListItem from '../components/SongListItem';
import SongDetailPanel from '../components/SongDetailPanel';
import MusicPlayer from '../components/MusicPlayer';
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
  const [currentPlayingSong, setCurrentPlayingSong] = useState<Song | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const decodedMood = mood ? decodeURIComponent(mood) : '';
  const filteredSongs = songs.filter(
    song => song.mood === decodedMood && song.language === selectedLanguage
  );

  // 初始化第一首歌曲
  useEffect(() => {
    if (filteredSongs.length > 0 && !selectedSong) {
      setSelectedSong(filteredSongs[0]);
      setCurrentIndex(0);
      console.log(`初始化第一首歌曲: ${filteredSongs[0].songName}, 索引: 0`);
    }
  }, [filteredSongs, selectedSong]);

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    // Auto play when song is selected
    const index = filteredSongs.findIndex(s => s.songName === song.songName);
    setCurrentIndex(index);
    setCurrentPlayingSong(song);
    console.log(`選擇歌曲: ${song.songName}, 索引: ${index}`);
  };

  const handleSongPlay = (song: Song) => {
    const index = filteredSongs.findIndex(s => s.songName === song.songName);
    setCurrentIndex(index);
    setCurrentPlayingSong(song);
    setSelectedSong(song);
    console.log(`播放歌曲: ${song.songName}, 索引: ${index}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleNext = () => {
    setCurrentIndex(prevIndex => {
      console.log(`當前索引: ${prevIndex}, 總歌曲數: ${filteredSongs.length}`);
      if (prevIndex < filteredSongs.length - 1) {
        const nextIndex = prevIndex + 1;
        const nextSong = filteredSongs[nextIndex];
        setCurrentPlayingSong(nextSong);
        setSelectedSong(nextSong);
        console.log(`自動播放下一首 (索引 ${nextIndex}): ${nextSong.songName} - ${nextSong.artist}`);
        return nextIndex;
      } else {
        console.log('已播放到最後一首歌曲');
        return prevIndex;
      }
    });
  };

  const handlePrevious = () => {
    setCurrentIndex(prevIndex => {
      if (prevIndex > 0) {
        const newIndex = prevIndex - 1;
        const prevSong = filteredSongs[newIndex];
        setCurrentPlayingSong(prevSong);
        setSelectedSong(prevSong);
        console.log(`播放上一首 (索引 ${newIndex}): ${prevSong.songName} - ${prevSong.artist}`);
        return newIndex;
      }
      return prevIndex;
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        background: 'linear-gradient(135deg, #1A1410 0%, #2D1810 100%)',
        pb: currentPlayingSong ? 12 : 0, // Add padding at bottom when player is visible
        pt: 8, // Add padding for global header
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <Container maxWidth="xl" sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', py: 2 }}>
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
        </Box>

        {/* Header - Moved to Grid */}

        {/* Main Content */}
        {filteredSongs.length > 0 ? (
          <Grid container spacing={2} sx={{ minHeight: 'calc(100vh - 140px)' }}>
            {/* Left Side - Song List */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={3}
                sx={{
                  backgroundColor: 'background.paper',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Left Header */}
                <Box sx={{ p: 3 }}>
                  <Typography
                    variant="h4"
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
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedLanguage}歌曲 · 共 {filteredSongs.length} 首
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    歌曲列表
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {filteredSongs.map((song, index) => (
                    <SongListItem
                      key={index}
                      song={song}
                      isSelected={selectedSong?.songName === song.songName}
                      isPlaying={currentPlayingSong?.songName === song.songName}
                      onSelect={() => handleSongSelect(song)}
                      onPlay={() => handleSongPlay(song)}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Right Side - Song Details */}
            <Grid item xs={12} md={7}>
              <SongDetailPanel song={selectedSong} />
            </Grid>
          </Grid>
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
      </Container>

      {/* Music Player */}
      <MusicPlayer
        currentSong={currentPlayingSong}
        onNext={filteredSongs.length > 0 ? handleNext : undefined}
        onPrevious={filteredSongs.length > 0 ? handlePrevious : undefined}
      />
    </Box>
  );
};

export default PlaylistPage;

