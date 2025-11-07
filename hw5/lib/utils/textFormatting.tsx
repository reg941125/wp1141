/**
 * Convert URLs in text to clickable links
 * Also handles hashtags and mentions
 */
export function formatTextWithLinks(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;

  // Combined regex for URLs, mentions, and hashtags
  const combinedRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|@\w+|#\w+)/g;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedText = match[0];

    // Check if it's a URL
    if (matchedText.match(/^(https?:\/\/|www\.)/i)) {
      const url = matchedText.startsWith('www.') ? `https://${matchedText}` : matchedText;
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    } else if (matchedText.startsWith('@')) {
      // Mention - handled by TextWithMentions component
      parts.push(matchedText);
    } else if (matchedText.startsWith('#')) {
      // Hashtag
      parts.push(
        <span key={match.index} className="text-blue-500 font-medium">
          {matchedText}
        </span>
      );
    } else {
      parts.push(matchedText);
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

