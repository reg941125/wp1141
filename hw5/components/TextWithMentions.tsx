'use client';

import { useRouter } from 'next/navigation';

interface TextWithMentionsProps {
  text: string;
}

export default function TextWithMentions({ text }: TextWithMentionsProps) {
  const router = useRouter();

  // Combined regex for URLs, mentions, and hashtags
  const combinedRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|@\w+|#\w+)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex lastIndex
  combinedRegex.lastIndex = 0;

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
      // Mention
      const userId = matchedText.substring(1);
      parts.push(
        <span
          key={match.index}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/profile/${userId}`);
          }}
          className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer font-medium"
        >
          {matchedText}
        </span>
      );
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

  // If no matches, return original text
  if (parts.length === 0) {
    return <span>{text}</span>;
  }

  return <>{parts}</>;
}

