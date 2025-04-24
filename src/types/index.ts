export interface Genre {
    name: string;
  }
  
  export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    coverImage?: string
    genres: string[];
    audioFile?: string; 
  }
  