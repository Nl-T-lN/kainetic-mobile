export const APIConfig = {
  YOUTUBE: {
    BROWSE_API: 'https://music.youtube.com/youtubei/v1/browse',
    SEARCH_API: 'https://music.youtube.com/youtubei/v1/search',
    NEXT_API: 'https://music.youtube.com/youtubei/v1/next',
    WEB_CLIENT_PAYLOAD: {
      clientName: 'WEB_REMIX',
      clientVersion: '1.20231214.00.00',
      hl: 'en',
      gl: 'US',
    }
  }
};

/**
 * Deep search helper to find all occurrences of a key in a nested object.
 * Essential for parsing YouTube's dynamic and deeply nested JSON responses.
 */
export function findKeys(obj: any, key: string, results: any[] = []): any[] {
  if (typeof obj !== 'object' || obj === null) return results;
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    results.push(obj[key]);
  }
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      findKeys(obj[k], key, results);
    }
  }
  return results;
}
