import React from 'react';
import {
  ToggleButtonGroup,
  ToggleButton,
  Box,
} from '@mui/material';
import { Language } from '../types/Song';

interface LanguageSwitcherProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  selectedLanguage,
  onLanguageChange,
}) => {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newLanguage: Language | null
  ) => {
    if (newLanguage !== null) {
      onLanguageChange(newLanguage);
    }
  };

  return (
    <Box>
      <ToggleButtonGroup
        value={selectedLanguage}
        exclusive
        onChange={handleChange}
        sx={{
          '& .MuiToggleButton-root': {
            color: 'text.secondary',
            borderColor: 'rgba(255, 138, 101, 0.3)',
            px: 3,
            py: 1,
            fontSize: '1rem',
            fontWeight: 500,
            '&.Mui-selected': {
              background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
              color: '#fff',
              borderColor: 'primary.main',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF7043 30%, #FF8A65 90%)',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 138, 101, 0.1)',
            },
          },
        }}
      >
        <ToggleButton value="中文">
          🇹🇼 中文
        </ToggleButton>
        <ToggleButton value="英文">
          🇬🇧 英文
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default LanguageSwitcher;

