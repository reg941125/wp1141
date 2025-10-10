import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { Language } from '../types/Song';

interface LanguageSelectionDialogProps {
  open: boolean;
  onSelect: (language: Language) => void;
}

const LanguageSelectionDialog: React.FC<LanguageSelectionDialogProps> = ({
  open,
  onSelect,
}) => {
  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <LanguageIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="div" fontWeight={600}>
          選擇歌曲語言
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          請選擇你想要聆聽的歌曲語言
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 4, px: 4 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            justifyContent: 'center',
            mt: 2,
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => onSelect('中文')}
            sx={{
              flex: 1,
              py: 3,
              fontSize: '1.3rem',
              background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF7043 30%, #FF8A65 90%)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            🇹🇼 中文歌曲
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={() => onSelect('英文')}
            sx={{
              flex: 1,
              py: 3,
              fontSize: '1.3rem',
              background: 'linear-gradient(45deg, #FF8A65 30%, #FFAB91 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF7043 30%, #FF8A65 90%)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            🇬🇧 英文歌曲
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageSelectionDialog;

