/**
 * Calculate character count for post content
 * Rules:
 * - Links (URLs) count as 23 characters regardless of length
 * - Hashtags (#hashtag) don't count
 * - Mentions (@userid) don't count
 */
export function calculateCharacterCount(text: string): number {
  if (!text) return 0;

  // Extract URLs (http://, https://, www.)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const urls: string[] = [];
  let match;
  
  // Reset regex lastIndex
  urlRegex.lastIndex = 0;
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[0]);
  }

  const urlCount = urls.length;

  // Remove URLs from text for counting (replace with placeholder to preserve positions)
  let textWithoutUrls = text;
  urls.forEach((url) => {
    textWithoutUrls = textWithoutUrls.replace(url, '');
  });

  // Remove hashtags (#hashtag)
  const hashtagRegex = /#\w+/g;
  const textWithoutHashtags = textWithoutUrls.replace(hashtagRegex, '');

  // Remove mentions (@userid)
  const mentionRegex = /@\w+/g;
  const textWithoutMentions = textWithoutHashtags.replace(mentionRegex, '');

  // Count remaining characters
  const remainingChars = textWithoutMentions.length;

  // Add 23 characters for each URL
  return remainingChars + urlCount * 23;
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  return text.match(urlRegex) || [];
}

/**
 * Check if text contains a valid URL
 */
export function isValidUrl(text: string): boolean {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  return urlRegex.test(text);
}

