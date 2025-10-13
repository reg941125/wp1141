import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import HomePage from './pages/HomePage';
import PlaylistPage from './pages/PlaylistPage';
import CustomPlaylistPage from './pages/CustomPlaylistPage';
import CustomPlaylistPlayerPage from './pages/CustomPlaylistPlayerPage';
import LanguageSelectionDialog from './components/LanguageSelectionDialog';
import GlobalHeader from './components/GlobalHeader';
import { Song, Language } from './types/Song';
import { parseCSV, getMoodsFromSongs } from './utils/csvParser';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF8A65',
      light: '#FFB993',
      dark: '#C75B39',
    },
    secondary: {
      main: '#FFAB91',
      light: '#FFCCBC',
      dark: '#D17A61',
    },
    background: {
      default: '#1A1410',
      paper: '#2D2419',
    },
    text: {
      primary: '#FFF3E0',
      secondary: '#FFCCBC',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Microsoft JhengHei"',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#2D2419',
          '&:hover': {
            backgroundColor: '#3A2F21',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load CSV file on mount
  useEffect(() => {
    const loadCSV = async () => {
      try {
        const response = await fetch('/sample_songs.csv');
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        const file = new File([blob], 'sample_songs.csv', { type: 'text/csv' });
        
        const parsedSongs = await parseCSV(file);
        setSongs(parsedSongs);
        setLoading(false);
      } catch (error) {
        console.error('Error loading CSV:', error);
        alert('載入歌曲資料時發生錯誤。');
        setLoading(false);
      }
    };

    loadCSV();
  }, []);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setLanguageDialogOpen(false);
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
  };

  // Update moods when language changes
  useEffect(() => {
    if (songs.length > 0 && selectedLanguage) {
      const languageFilteredSongs = songs.filter(
        song => song.language === selectedLanguage
      );
      const extractedMoods = getMoodsFromSongs(languageFilteredSongs);
      setMoods(extractedMoods);
    }
  }, [selectedLanguage, songs]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* Language Selection Dialog */}
        <LanguageSelectionDialog
          open={languageDialogOpen}
          onSelect={handleLanguageSelect}
        />

        {/* Global Header */}
        {selectedLanguage && !loading && (
          <GlobalHeader
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
          />
        )}

        {/* Routes */}
        {selectedLanguage && !loading && (
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <HomePage
                          moods={moods}
                          selectedLanguage={selectedLanguage}
                          onLanguageChange={handleLanguageChange}
                        />
                      }
                    />
                    <Route
                      path="/playlist/:mood"
                      element={
                        <PlaylistPage
                          songs={songs}
                          selectedLanguage={selectedLanguage}
                          onLanguageChange={handleLanguageChange}
                        />
                      }
                    />
                    <Route
                      path="/custom-playlist"
                      element={
                        <CustomPlaylistPage
                          songs={songs}
                          selectedLanguage={selectedLanguage}
                          onLanguageChange={handleLanguageChange}
                        />
                      }
                    />
                    <Route
                      path="/custom-playlist/:playlistId"
                      element={<CustomPlaylistPlayerPage />}
                    />
                  </Routes>
                )}
      </Router>
    </ThemeProvider>
  );
}

export default App;
