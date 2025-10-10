import Papa from 'papaparse';
import { Song } from '../types/Song';

export const parseCSV = (file: File): Promise<Song[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const songs: Song[] = results.data.map((row: any) => ({
            language: row['語言'] || row['language'] || '',
            mood: row['情緒'] || row['mood'] || '',
            songName: row['歌曲名'] || row['songName'] || '',
            artist: row['作者'] || row['artist'] || '',
            spotifyUrl: row['spotify網址'] || row['spotifyUrl'] || '',
            youtubeUrl: row['youtube網址'] || row['youtubeUrl'] || '',
            description: row['歌曲介紹'] || row['description'] || '',
          }));
          resolve(songs.filter(song => song.mood && song.songName && song.language));
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const getMoodsFromSongs = (songs: Song[]): string[] => {
  const moods = new Set<string>();
  songs.forEach(song => {
    if (song.mood) {
      moods.add(song.mood);
    }
  });
  return Array.from(moods);
};


