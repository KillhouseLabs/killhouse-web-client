export interface AnsiSegment {
  text: string;
  color: string | null;
  bold: boolean;
}

// ANSI color code mappings
const COLOR_MAP: Record<number, string> = {
  30: "black",
  31: "red",
  32: "green",
  33: "yellow",
  34: "blue",
  35: "magenta",
  36: "cyan",
  37: "white",
  90: "bright-black",
  91: "bright-red",
  92: "bright-green",
  93: "bright-yellow",
  94: "bright-blue",
  95: "bright-magenta",
  96: "bright-cyan",
  97: "bright-white",
};

export function parseAnsi(input: string): AnsiSegment[] {
  if (!input) return [];

  const segments: AnsiSegment[] = [];
  // eslint-disable-next-line no-control-regex
  const regex = /\x1b\[([0-9;]+)m/g;

  let lastIndex = 0;
  let currentColor: string | null = null;
  let currentBold = false;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    const beforeText = input.substring(lastIndex, match.index);

    // Add segment for text before this escape code
    if (beforeText) {
      segments.push({
        text: beforeText,
        color: currentColor,
        bold: currentBold,
      });
    }

    // Parse the escape code
    const codes = match[1].split(";").map(Number);

    for (const code of codes) {
      if (code === 0) {
        // Reset all formatting
        currentColor = null;
        currentBold = false;
      } else if (code === 1) {
        // Bold
        currentBold = true;
      } else if (COLOR_MAP[code]) {
        // Color code
        currentColor = COLOR_MAP[code];
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last escape code
  const remainingText = input.substring(lastIndex);
  if (remainingText) {
    segments.push({
      text: remainingText,
      color: currentColor,
      bold: currentBold,
    });
  }

  // Filter out empty text segments
  return segments.filter((segment) => segment.text.length > 0);
}
