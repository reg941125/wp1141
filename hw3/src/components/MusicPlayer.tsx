import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Slider,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Song } from '../types/Song';

interface MusicPlayerProps {
  currentSong: Song | null;
  onNext?: () => void;
  onPrevious?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentSong,
  onNext,
  onPrevious,
}) => {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true);
      };
    } else {
      setIsReady(true);
    }
  }, []);

  // Initialize player when ready and song changes
  useEffect(() => {
    if (isReady && currentSong && currentSong.youtubeUrl) {
      const videoId = getYouTubeVideoId(currentSong.youtubeUrl);
      if (videoId) {
        if (playerRef.current) {
          playerRef.current.loadVideoById(videoId);
          setCurrentTime(0);
          // Auto play when new song is loaded
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.playVideo();
            }
          }, 500);
        } else {
          playerRef.current = new window.YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: videoId,
            playerVars: {
              autoplay: 1, // Auto play when player is ready
              controls: 0,
            },
            events: {
              onStateChange: (event: any) => {
                const isNowPlaying = event.data === window.YT.PlayerState.PLAYING;
                setIsPlaying(isNowPlaying);
                
                // Auto play next song when current song ends
                if (event.data === window.YT.PlayerState.ENDED && onNext) {
                  console.log('歌曲播放完畢，自動播放下一首');
                  setTimeout(() => {
                    onNext();
                  }, 1000); // 延遲1秒後播放下一首，讓用戶知道歌曲已結束
                }
              },
              onReady: () => {
                if (playerRef.current) {
                  const dur = playerRef.current.getDuration();
                  setDuration(dur);
                }
              },
            },
          });
        }
      }
    }
  }, [isReady, currentSong, onNext]);

  // Update progress bar
  useEffect(() => {
    if (isPlaying && playerRef.current && !isDragging) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const time = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          setCurrentTime(time);
          setDuration(dur);
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isDragging]);

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const vol = newValue as number;
    setVolume(vol);
    if (playerRef.current) {
      playerRef.current.setVolume(vol);
    }
  };

  const handleProgressChange = (event: Event, newValue: number | number[]) => {
    const time = newValue as number;
    setCurrentTime(time);
  };

  const handleProgressChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    const time = newValue as number;
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true);
    }
    setIsDragging(false);
  };

  const handleProgressMouseDown = () => {
    setIsDragging(true);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return null;
  }

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        backgroundColor: 'background.paper',
        borderTop: '2px solid',
        borderColor: 'primary.main',
        zIndex: 1000,
      }}
    >
      <div id="youtube-player" style={{ display: 'none' }}></div>
      
      <Box sx={{ width: '100%' }}>
        {/* Progress Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
            {formatTime(currentTime)}
          </Typography>
          <Slider
            value={currentTime}
            max={duration || 100}
            onChange={handleProgressChange}
            onChangeCommitted={handleProgressChangeCommitted}
            onMouseDown={handleProgressMouseDown}
            disabled={!currentSong.youtubeUrl || duration === 0}
            sx={{
              flex: 1,
              color: 'primary.main',
              height: 4,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0px 0px 0px 8px rgba(255, 138, 101, 0.16)',
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.3,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
            {formatTime(duration)}
          </Typography>
        </Box>

        {/* Controls and Info */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Song Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              noWrap
              color="text.primary"
            >
              {currentSong.songName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {currentSong.artist}
            </Typography>
          </Box>

        {/* Controls */}
        <Stack direction="row" spacing={1} alignItems="center">
          {onPrevious && (
            <IconButton
              onClick={onPrevious}
              sx={{ color: 'primary.main' }}
            >
              <SkipPreviousIcon />
            </IconButton>
          )}
          
          <IconButton
            onClick={handlePlayPause}
            disabled={!currentSong.youtubeUrl}
            sx={{
              backgroundColor: 'primary.main',
              color: '#fff',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&:disabled': {
                backgroundColor: 'action.disabledBackground',
              },
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>

          {onNext && (
            <IconButton
              onClick={onNext}
              sx={{ color: 'primary.main' }}
            >
              <SkipNextIcon />
            </IconButton>
          )}
        </Stack>

          {/* Volume Control */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ minWidth: 120, display: { xs: 'none', md: 'flex' } }}
          >
            <VolumeUpIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Slider
              value={volume}
              onChange={handleVolumeChange}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                },
              }}
            />
          </Stack>

          {/* Links */}
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            {currentSong.spotifyUrl && (
              <IconButton
                component="a"
                href={currentSong.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: '#1DB954' }}
                title="在 Spotify 上播放"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </IconButton>
            )}
            {currentSong.youtubeUrl && (
              <IconButton
                component="a"
                href={currentSong.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: '#FF0000' }}
                title="在 YouTube 上播放"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default MusicPlayer;

