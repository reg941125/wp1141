/**
 * Extract all @mentions from text
 * Returns an array of unique userIds mentioned in the text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions = new Set<string>();
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const userId = match[1];
    mentions.add(userId);
  }

  return Array.from(mentions);
}

