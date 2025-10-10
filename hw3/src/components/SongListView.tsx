import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PersonIcon from '@mui/icons-material/Person';
import { Song } from '../types/Song';

interface SongListViewProps {
  songs: Song[];
  onSongClick: (song: Song) => void;
}

const SongListView: React.FC<SongListViewProps> = ({ songs, onSongClick }) => {
  return (
    <Paper
      elevation={4}
      sx={{
        backgroundColor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <List sx={{ py: 0 }}>
        {songs.map((song, index) => (
          <React.Fragment key={index}>
            <ListItem
              disablePadding
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 138, 101, 0.08)',
                },
              }}
            >
              <ListItemButton
                onClick={() => onSongClick(song)}
                sx={{
                  py: 2.5,
                  px: 3,
                }}
              >
                {/* Number */}
                <Box
                  sx={{
                    minWidth: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    {index + 1}
                  </Typography>
                </Box>

                {/* Icon */}
                <ListItemIcon sx={{ minWidth: 60 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 138, 101, 0.15)',
                      borderRadius: 2,
                    }}
                  >
                    <MusicNoteIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  </Box>
                </ListItemIcon>

                {/* Song Info */}
                <ListItemText
                  primary={
                    <Typography
                      variant="h6"
                      component="div"
                      color="text.primary"
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {song.songName}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {song.artist}
                      </Typography>
                    </Box>
                  }
                />

                {/* Description Preview */}
                {song.description && (
                  <Box
                    sx={{
                      flex: 1,
                      maxWidth: 400,
                      ml: 2,
                      display: { xs: 'none', md: 'block' },
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {song.description}
                    </Typography>
                  </Box>
                )}
              </ListItemButton>
            </ListItem>
            {index < songs.length - 1 && (
              <Divider sx={{ borderColor: 'rgba(255, 138, 101, 0.1)' }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default SongListView;

