import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SongListItem from '../components/SongListItem';
import SongDetailPanel from '../components/SongDetailPanel';
import MusicPlayer from '../components/MusicPlayer';
import { Song, CustomPlaylist } from '../types/Song';

const CustomPlaylistPlayerPage: React.FC = () => {
  const navigate = useNavigate();
  const { playlistId } = useParams<{ playlistId: string }>();
  const [customPlaylist, setCustomPlaylist] = useState<CustomPlaylist | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<Song | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 載入自訂歌單
  useEffect(() => {
    if (playlistId) {
      const savedPlaylists = localStorage.getItem('customPlaylists');
      if (savedPlaylists) {
        try {
          const playlists: CustomPlaylist[] = JSON.parse(savedPlaylists);
          const playlist = playlists.find(p => p.id === playlistId);
          if (playlist) {
            setCustomPlaylist(playlist);
            // 設置第一首歌曲為選中狀態
            if (playlist.songs.length > 0) {
              setSelectedSong(playlist.songs[0]);
              setCurrentIndex(0);
            }
          }
        } catch (error) {
          console.error('載入自訂歌單失敗:', error);
        }
      }
    }
  }, [playlistId]);

  const handleBack = () => {
    navigate('/custom-playlist');
  };

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    // Auto play when song is selected
    const index = customPlaylist?.songs.findIndex(s => s.songName === song.songName) || 0;
    setCurrentIndex(index);
    setCurrentPlayingSong(song);
    console.log(`選擇歌曲: ${song.songName}, 索引: ${index}`);
  };

  const handleSongPlay = (song: Song) => {
    const index = customPlaylist?.songs.findIndex(s => s.songName === song.songName) || 0;
    setCurrentIndex(index);
    setCurrentPlayingSong(song);
    setSelectedSong(song);
    console.log(`播放歌曲: ${song.songName}, 索引: ${index}`);
  };

  const handleNext = () => {
    setCurrentIndex(prevIndex => {
      const songs = customPlaylist?.songs || [];
      console.log(`當前索引: ${prevIndex}, 總歌曲數: ${songs.length}`);
      if (prevIndex < songs.length - 1) {
        const nextIndex = prevIndex + 1;
        const nextSong = songs[nextIndex];
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
      const songs = customPlaylist?.songs || [];
      if (prevIndex > 0) {
        const newIndex = prevIndex - 1;
        const prevSong = songs[newIndex];
        setCurrentPlayingSong(prevSong);
        setSelectedSong(prevSong);
        console.log(`播放上一首 (索引 ${newIndex}): ${prevSong.songName} - ${prevSong.artist}`);
        return newIndex;
      }
      return prevIndex;
    });
  };

  if (!customPlaylist) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #1A1410 0%, #2D1810 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              p: 6,
              textAlign: 'center',
              backgroundColor: 'background.paper',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              找不到指定的歌單
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              請檢查歌單是否存在或已被刪除
            </Typography>
            <Button variant="contained" onClick={handleBack}>
              返回自訂歌單
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #1A1410 0%, #2D1810 100%)',
        pb: currentPlayingSong ? 12 : 0,
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
        </Box>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
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
            {customPlaylist.name}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            自訂歌單 · 共 {customPlaylist.songs.length} 首
          </Typography>
        </Box>

        {/* Main Content */}
        {customPlaylist.songs.length > 0 ? (
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
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    歌曲列表
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {customPlaylist.songs.map((song, index) => (
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
              這個歌單目前沒有歌曲
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              請返回自訂歌單頁面添加歌曲
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Music Player */}
      <MusicPlayer
        currentSong={currentPlayingSong}
        onNext={customPlaylist.songs.length > 0 ? handleNext : undefined}
        onPrevious={customPlaylist.songs.length > 0 ? handlePrevious : undefined}
      />
    </Box>
  );
};

export default CustomPlaylistPlayerPage;
