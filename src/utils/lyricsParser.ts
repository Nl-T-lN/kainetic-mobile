export interface LyricWord {
  text: string;
  startTimeMs: number;
  durationMs: number;
  hasTrailingSpace: boolean;
}

export interface ParsedLyricLine {
  text: string;
  startTimeMs: number;
  durationMs: number;
  words: LyricWord[];
  isBackground: boolean;
  syncType: 'word' | 'line' | 'unsynced';
}

function parseTime(timeStr: string | number | undefined): number {
  if (!timeStr) return 0;
  if (typeof timeStr === "number") return timeStr;

  const t = timeStr.trim();
  const parts = t.split(":");
  
  if (parts.length === 1) {
      if (t.endsWith("ms")) return parseFloat(t.replace("ms", ""));
      if (t.endsWith("s")) return parseFloat(t.replace("s", "")) * 1000;
      if (t.endsWith("m")) return parseFloat(t.replace("m", "")) * 60000;
      if (t.endsWith("h")) return parseFloat(t.replace("h", "")) * 3600000;
      return parseFloat(t) * 1000;
  }
  
  if (parts.length === 2) {
      return (parseInt(parts[0], 10) * 60 + parseFloat(parts[1])) * 1000;
  }
  
  if (parts.length === 3) {
      return (parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2])) * 1000;
  }
  
  return 0;
}

export function parseTTML(ttmlText: string): ParsedLyricLine[] {
  const pRegex = /<p[^>]*begin="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g;
  const result: ParsedLyricLine[] = [];
  
  let match;
  while ((match = pRegex.exec(ttmlText)) !== null) {
    const beginTimeMs = parseTime(match[1]);
    const innerHtml = match[2];

    const spanRegex = /<span[^>]*begin="([^"]+)"[^>]*end="([^"]+)"[^>]*>([\s\S]*?)<\/span>([^<]*)/g;
    const words: LyricWord[] = [];
    
    let spanMatch;
    let hasSpans = false;
    let fullText = "";

    while ((spanMatch = spanRegex.exec(innerHtml)) !== null) {
      hasSpans = true;
      const startMs = parseTime(spanMatch[1]);
      const endMs = parseTime(spanMatch[2]);
      let rawText = spanMatch[3];
      let trailingText = spanMatch[4] || "";
      
      const isHtmlEntity = rawText.includes("&");
      if (isHtmlEntity) {
        rawText = rawText.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
      }
      
      const space = trailingText.includes(" ") || rawText.endsWith(" ");
      const text = rawText.trim();
      
      if (text) {
        words.push({
          text: text,
          startTimeMs: startMs,
          durationMs: endMs - startMs,
          hasTrailingSpace: space
        });
        fullText += text + (space ? " " : "");
      }
    }
    
    if (!hasSpans) {
        const cleanText = innerHtml.replace(/<[^>]+>/g, "").trim();
        if (cleanText) {
            result.push({
                text: cleanText,
                startTimeMs: beginTimeMs,
                durationMs: 0,
                words: [],
                isBackground: false,
                syncType: 'line'
            });
        }
    } else if (words.length > 0) {
        result.push({
            text: fullText.trim(),
            startTimeMs: beginTimeMs,
            durationMs: 0,
            words,
            isBackground: false,
            syncType: 'word'
        });
    }
  }
  
  result.forEach((line, index) => {
    if (index < result.length - 1) {
      line.durationMs = result[index + 1].startTimeMs - line.startTimeMs;
    } else {
      line.durationMs = 5000;
    }
  });

  return result;
}

export function parseLRC(lrcText: string): ParsedLyricLine[] {
    const lines = lrcText.split("\n");
    const result: ParsedLyricLine[] = [];
  
    lines.forEach(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3].padEnd(3, "0"), 10);
        const text = match[4].trim();
  
        const timeMs = (minutes * 60 + seconds) * 1000 + milliseconds;
        if (text) {
          result.push({ 
            text, 
            startTimeMs: timeMs, 
            durationMs: 0, 
            words: [], 
            isBackground: false,
            syncType: 'line' 
          });
        }
      }
    });
    
    for (let i = 0; i < result.length; i++) {
        const currentLine = result[i];
        if (i < result.length - 1) {
            currentLine.durationMs = result[i + 1].startTimeMs - currentLine.startTimeMs;
        } else {
            currentLine.durationMs = 5000;
        }
    }
  
    return result;
}
