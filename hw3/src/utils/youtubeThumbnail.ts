/**
 * 從 YouTube URL 提取影片 ID
 */
export const getYouTubeVideoId = (url: string): string | null => {
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

/**
 * 獲取 YouTube 影片縮圖 URL
 * @param url YouTube 影片 URL
 * @param quality 縮圖品質 - default, medium, high, standard, maxres
 * @returns 縮圖 URL
 */
export const getYouTubeThumbnail = (
  url: string,
  quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'
): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;

  const qualityMap = {
    default: 'default.jpg',       // 120x90
    medium: 'mqdefault.jpg',      // 320x180
    high: 'hqdefault.jpg',        // 480x360
    standard: 'sddefault.jpg',    // 640x480
    maxres: 'maxresdefault.jpg',  // 最高畫質
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
};

