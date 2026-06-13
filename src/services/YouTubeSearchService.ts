import { SearchResult } from '@/types/music';

const SEARCH_API = 'https://music.youtube.com/youtubei/v1/search';

const WEB_CLIENT_PAYLOAD = {
  clientName: 'WEB_REMIX',
  clientVersion: '1.20231214.00.00',
  hl: 'en',
  gl: 'US',
};

// Deep search helper to find all instances of a key in a JSON object
function findKeys(obj: any, key: string, results: any[] = []) {
  if (typeof obj !== 'object' || obj === null) return;
  if (obj.hasOwnProperty(key)) {
    results.push(obj[key]);
  }
  for (const k in obj) {
    if (obj.hasOwnProperty(k)) {
      findKeys(obj[k], key, results);
    }
  }
  return results;
}

export class YouTubeSearchService {
  /**
   * Searches YouTube Music directly and parses the complex JSON AST
   * into a clean SearchResult array.
   */
  static async search(query: string, type: 'song' | 'artist' | 'album' = 'song'): Promise<SearchResult[]> {
    try {
      // Params string for filtering. These are standard InnerTube params.
      // Eg-KAQwIARAO = Songs
      // Eg-KAQwIARAB = Albums
      // Eg-KAQwIARAW = Artists
      let params = '';
      if (type === 'song') params = 'Eg-KAQwIARAO';
      if (type === 'album') params = 'Eg-KAQwIARAB';
      if (type === 'artist') params = 'Eg-KAQwIARAW';

      const response = await fetch(SEARCH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Origin': 'https://music.youtube.com',
          'Referer': 'https://music.youtube.com/',
        },
        body: JSON.stringify({
          context: { client: WEB_CLIENT_PAYLOAD },
          query: query,
          params: params ? params : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Extract all musicResponsiveListItemRenderer objects (the actual items)
      const renderers = findKeys(data, 'musicResponsiveListItemRenderer');
      
      const results: SearchResult[] = [];

      for (const renderer of renderers) {
        // 1. Extract ID
        let videoId = 
          renderer.playlistItemData?.videoId ||
          renderer.navigationEndpoint?.watchEndpoint?.videoId ||
          renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;

        let browseId = renderer.navigationEndpoint?.browseEndpoint?.browseId;
        
        const id = type === 'song' ? videoId : browseId;
        if (!id) continue; // Skip if we can't find a valid ID for the requested type

        // 2. Extract Title
        const titleRuns = renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
        const title = titleRuns?.[0]?.text || 'Unknown Title';

        // 3. Extract Subtitle (Artist / Info)
        const subtitleRuns = renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
        let subtitle = 'Unknown';
        if (subtitleRuns) {
          subtitle = subtitleRuns.map((r: any) => r.text).join('').replace(/•/g, '').trim();
        }

        // 4. Extract Thumbnail
        const thumbnails = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;
        const thumbnailUrl = thumbnails?.length > 0 ? thumbnails[thumbnails.length - 1].url : '';

        // Push to results
        results.push({
          videoId: type === 'song' ? id : undefined,
          id: type !== 'song' ? id : undefined,
          title: title,
          channelTitle: subtitle, // We map subtitle to channelTitle for simplicity
          thumbnailUrl: thumbnailUrl,
          type: type,
          durationMs: 0, // We can't easily parse duration from search AST without complex regex
        });
      }

      return results;

    } catch (error) {
      console.error('[YouTubeSearchService] Error:', error);
      return [];
    }
  }
}
