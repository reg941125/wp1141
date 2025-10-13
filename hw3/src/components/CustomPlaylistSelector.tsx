import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Fade,
  Alert,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import {
  PlaylistPlay as PlaylistPlayIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { CustomPlaylist } from '../types/Song';

interface CustomPlaylistSelectorProps {
  onPlaylistSelect: (playlistId: string) => void;
}

const CustomPlaylistSelector: React.FC<CustomPlaylistSelectorProps> = ({
  onPlaylistSelect,
}) => {
  const navigate = useNavigate();
  const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  // 載入自訂歌單
  useEffect(() => {
    const loadCustomPlaylists = () => {
      try {
        const savedPlaylists = localStorage.getItem('customPlaylists');
        if (savedPlaylists) {
          const playlists: CustomPlaylist[] = JSON.parse(savedPlaylists);
          setCustomPlaylists(playlists);
        }
      } catch (error) {
        console.error('載入自訂歌單失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomPlaylists();
  }, []);

  // 刪除歌單
  const handleDeletePlaylist = (playlistId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('確定要刪除這個歌單嗎？')) {
      const updatedPlaylists = customPlaylists.filter(p => p.id !== playlistId);
      setCustomPlaylists(updatedPlaylists);
      
      try {
        localStorage.setItem('customPlaylists', JSON.stringify(updatedPlaylists));
      } catch (error) {
        console.error('刪除歌單失敗:', error);
      }
    }
  };

  // 編輯歌單
  const handleEditPlaylist = (playlistId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate('/custom-playlist');
  };

  // 選擇歌單
  const handlePlaylistClick = (playlistId: string) => {
    onPlaylistSelect(playlistId);
  };

  // 創建新歌單
  const handleCreateNew = () => {
    navigate('/custom-playlist');
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          載入自訂歌單中...
        </Typography>
      </Box>
    );
  }

  if (customPlaylists.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          還沒有自訂歌單
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          點擊下方按鈕建立你的第一個自訂歌單
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlaylistPlayIcon />}
          onClick={handleCreateNew}
          sx={{
            background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #FF7043 30%, #FF8A65 90%)',
            },
          }}
        >
          建立自訂歌單
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* 標題和操作按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          }}
        >
          我的自訂歌單
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PlaylistPlayIcon />}
          onClick={handleCreateNew}
          sx={{
            color: 'primary.main',
            borderColor: 'primary.main',
            '&:hover': {
              borderColor: 'primary.dark',
              backgroundColor: 'rgba(255, 138, 101, 0.1)',
            },
          }}
        >
          新建歌單
        </Button>
      </Box>

      {/* 歌單列表 */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        {customPlaylists.map((playlist) => (
          <Fade
            key={playlist.id}
            in={true}
            timeout={300}
            style={{ transitionDelay: `${customPlaylists.indexOf(playlist) * 100}ms` }}
          >
            <Paper
              elevation={3}
              sx={{
                minWidth: 280,
                maxWidth: 320,
                p: 3,
                cursor: 'pointer',
                backgroundColor: 'background.paper',
                border: '2px solid transparent',
                transition: 'all 0.3s ease',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(255, 138, 101, 0.3)',
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(255, 138, 101, 0.05)',
                },
              }}
              onClick={() => handlePlaylistClick(playlist.id)}
            >
              {/* 操作按鈕 */}
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  opacity: 0.7,
                  '&:hover': { opacity: 1 },
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => handleEditPlaylist(playlist.id, e)}
                  sx={{
                    color: 'primary.main',
                    backgroundColor: 'rgba(255, 138, 101, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 138, 101, 0.2)',
                    },
                  }}
                  title="編輯歌單"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                  sx={{
                    color: 'error.main',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    },
                  }}
                  title="刪除歌單"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>

              {/* 歌單資訊 */}
              <Box sx={{ pr: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PlaylistPlayIcon sx={{ color: 'primary.main' }} />
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color="text.primary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {playlist.name}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${playlist.songs.length} 首歌曲`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 138, 101, 0.1)',
                      color: 'primary.main',
                      fontWeight: 500,
                    }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  建立於 {new Date(playlist.createdAt).toLocaleDateString('zh-TW')}
                </Typography>

                {/* 歌單預覽 */}
                {playlist.songs.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      包含歌曲：
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {playlist.songs.slice(0, 2).map((song, index) => (
                        <Typography
                          key={index}
                          variant="caption"
                          color="text.primary"
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {song.songName} - {song.artist}
                        </Typography>
                      ))}
                      {playlist.songs.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          還有 {playlist.songs.length - 2} 首歌曲...
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Fade>
        ))}
      </Box>

      {/* 提示訊息 */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ backgroundColor: 'rgba(255, 138, 101, 0.1)' }}>
          <Typography variant="body2">
            點擊歌單卡片開始播放，或使用右上角按鈕管理歌單
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default CustomPlaylistSelector;
