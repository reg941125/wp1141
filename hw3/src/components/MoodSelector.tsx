import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

interface MoodSelectorProps {
  moods: string[];
  selectedMood: string;
  onMoodSelect: (mood: string) => void;
}

const moodEmojis: { [key: string]: string } = {
  '快樂': '😊',
  '悲傷': '😢',
  '放鬆': '😌',
  '興奮': '🤩',
  '平靜': '😇',
  '憂鬱': '😔',
  '浪漫': '💕',
  '懷舊': '🌅',
  '激勵': '💪',
  '孤獨': '🌙',
};

const getMoodEmoji = (mood: string): string => {
  return moodEmojis[mood] || '🎵';
};

const MoodSelector: React.FC<MoodSelectorProps> = ({
  moods,
  selectedMood,
  onMoodSelect,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SentimentSatisfiedAltIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1.5 }} />
        <Typography variant="h5" color="text.primary" fontWeight={600}>
          選擇你的心情
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {moods.map((mood) => (
          <Chip
            key={mood}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: '1.2rem' }}>{getMoodEmoji(mood)}</span>
                <span>{mood}</span>
              </Box>
            }
            onClick={() => onMoodSelect(mood)}
            color={selectedMood === mood ? 'primary' : 'default'}
            variant={selectedMood === mood ? 'filled' : 'outlined'}
            sx={{
              px: 2,
              py: 3,
              fontSize: '1.1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderWidth: 2,
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: 'primary.main',
              },
              ...(selectedMood === mood && {
                background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
                boxShadow: '0 3px 10px rgba(255, 138, 101, 0.4)',
              }),
            }}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default MoodSelector;


