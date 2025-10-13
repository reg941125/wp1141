export interface Song {
  language: string; // 中文 or 英文
  mood: string;
  songName: string;
  artist: string;
  spotifyUrl: string;
  youtubeUrl: string;
  description: string;
}

export interface CustomPlaylist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: Date;
}

export type Mood = string;
export type Language = '中文' | '英文';


