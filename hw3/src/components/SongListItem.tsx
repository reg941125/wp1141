import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PersonIcon from '@mui/icons-material/Person';
import { Song } from '../types/Song';

interface SongListItemProps {
  song: Song;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

const SongListItem: React.FC<SongListItemProps> = ({
  song,
  isSelected,
  isPlaying,
  onSelect,
  onPlay,
}) => {
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };

  return (
    <ListItem
      disablePadding
      sx={{
        backgroundColor: isSelected ? 'rgba(255, 138, 101, 0.15)' : 'transparent',
        borderLeft: isSelected ? '4px solid' : '4px solid transparent',
        borderColor: isSelected ? 'primary.main' : 'transparent',
        '&:hover': {
          backgroundColor: isSelected 
            ? 'rgba(255, 138, 101, 0.2)' 
            : 'rgba(255, 138, 101, 0.08)',
        },
      }}
    >
      <ListItemButton onClick={onSelect} sx={{ py: 1.5, px: 2 }}>
        {/* Play Button */}
        <ListItemIcon sx={{ minWidth: 40, mr: 1 }}>
          <IconButton
            onClick={handlePlayClick}
            size="small"
            sx={{
              color: isPlaying ? 'primary.main' : 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'rgba(255, 138, 101, 0.1)',
              },
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </ListItemIcon>

        {/* Song Info */}
        <ListItemText
          primary={
            <Typography
              variant="subtitle2"
              component="div"
              color="text.primary"
              sx={{
                fontWeight: isSelected ? 600 : 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {song.songName}
            </Typography>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {song.artist}
              </Typography>
            </Box>
          }
        />

        {/* Music Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MusicNoteIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        </Box>
      </ListItemButton>
    </ListItem>
  );
};

export default SongListItem;

