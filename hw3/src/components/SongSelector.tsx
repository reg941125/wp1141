import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  TextField,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  MusicNote as MusicNoteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Song } from '../types/Song';

interface SongSelectorProps {
  songs: Song[];
  selectedSongs: Song[];
  onSelectionChange: (selectedSongs: Song[]) => void;
  onSavePlaylist: (playlistName: string, selectedSongs: Song[]) => void;
  isEditing?: boolean;
  editingPlaylistName?: string;
}

const SongSelector: React.FC<SongSelectorProps> = ({
  songs,
  selectedSongs,
  onSelectionChange,
  onSavePlaylist,
  isEditing = false,
  editingPlaylistName = '',
}) => {
  const [playlistName, setPlaylistName] = useState(editingPlaylistName);

  // 當編輯歌單名稱改變時，更新本地狀態
  useEffect(() => {
    setPlaylistName(editingPlaylistName);
  }, [editingPlaylistName]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('全部');

  // 獲取所有情緒
  const moods = ['全部', ...Array.from(new Set(songs.map(song => song.mood)))];

  // 過濾歌曲
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.songName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = selectedMood === '全部' || song.mood === selectedMood;
    return matchesSearch && matchesMood;
  });

  const handleToggleSong = (song: Song) => {
    const isSelected = selectedSongs.some(s => s.songName === song.songName);
    if (isSelected) {
      onSelectionChange(selectedSongs.filter(s => s.songName !== song.songName));
    } else {
      onSelectionChange([...selectedSongs, song]);
    }
  };

  const handleRemoveSong = (songToRemove: Song) => {
    onSelectionChange(selectedSongs.filter(s => s.songName !== songToRemove.songName));
  };

  const handleSavePlaylist = () => {
    if (playlistName.trim() && selectedSongs.length > 0) {
      onSavePlaylist(playlistName.trim(), selectedSongs);
      setPlaylistName('');
      onSelectionChange([]);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      {/* 左側：歌曲選擇 */}
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          backgroundColor: 'background.paper',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 標題和搜索 */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
            選擇歌曲
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="搜索歌曲或藝人..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {moods.map((mood) => (
              <Chip
                key={mood}
                label={mood}
                clickable
                color={selectedMood === mood ? 'primary' : 'default'}
                onClick={() => setSelectedMood(mood)}
                size="small"
              />
            ))}
          </Stack>
        </Box>

        {/* 歌曲列表 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List>
            {filteredSongs.map((song, index) => {
              const isSelected = selectedSongs.some(s => s.songName === song.songName);
              return (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    onClick={() => handleToggleSong(song)}
                    sx={{
                      backgroundColor: isSelected ? 'rgba(255, 138, 101, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: isSelected 
                          ? 'rgba(255, 138, 101, 0.15)' 
                          : 'rgba(255, 138, 101, 0.05)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={isSelected}
                        color="primary"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {song.songName}
                          </Typography>
                          <Chip label={song.mood} size="small" variant="outlined" />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {song.artist}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            · {song.language}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemIcon>
                      <MusicNoteIcon sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Paper>

      {/* 右側：已選歌曲 */}
      <Paper
        elevation={3}
        sx={{
          width: 400,
          backgroundColor: 'background.paper',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 歌單命名 */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
            自訂歌單
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="輸入歌單名稱..."
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleSavePlaylist}
            disabled={!playlistName.trim() || selectedSongs.length === 0}
            startIcon={<AddIcon />}
          >
            {isEditing ? `更新歌單 (${selectedSongs.length})` : `建立歌單 (${selectedSongs.length})`}
          </Button>
        </Box>

        {/* 已選歌曲列表 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              已選擇的歌曲 ({selectedSongs.length})
            </Typography>
          </Box>
          <List>
            {selectedSongs.map((song, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  sx={{
                    py: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 138, 101, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <MusicNoteIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500}>
                        {song.songName}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {song.artist}
                      </Typography>
                    }
                  />
                  <ListItemIcon>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSong(song);
                      }}
                      sx={{ color: 'error.main' }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {selectedSongs.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                尚未選擇任何歌曲
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SongSelector;
