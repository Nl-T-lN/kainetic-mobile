import { SearchResult } from '@/types/music';

export function getHighResThumbnail(thumbnails: any): string {
  if (!thumbnails) return "";
  
  let thumbArray = thumbnails;
  if (typeof thumbnails === 'object' && !Array.isArray(thumbnails)) {
    if (thumbnails.contents && Array.isArray(thumbnails.contents)) {
      thumbArray = thumbnails.contents;
    } else if (thumbnails.thumbnails && Array.isArray(thumbnails.thumbnails)) {
      thumbArray = thumbnails.thumbnails;
    } else if (thumbnails.url) {
      thumbArray = [thumbnails];
    } else {
      thumbArray = [thumbnails];
    }
  } else if (!Array.isArray(thumbnails)) {
    thumbArray = [thumbnails];
  }

  if (!Array.isArray(thumbArray) || thumbArray.length === 0) return "";
  
  const sorted = [...thumbArray].sort((a, b) => (b.width || 0) - (a.width || 0));
  if (!sorted[0] || !sorted[0].url) return "";
  
  let url = sorted[0].url;

  if (url.includes("googleusercontent.com") || url.includes("yt3.ggpht.com")) {
    url = url.replace(/=[ws]\d+(?:-h\d+)?(?:-[a-zA-Z0-9_-]+)*/, "=w1200-h1200");
  } else if (url.includes("i.ytimg.com")) {
    url = url.replace("maxresdefault.jpg", "hqdefault.jpg");
  }
  
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }

  return url;
}

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
  static async search(query: string, type: 'song' | 'artist' | 'album' | 'playlist' | 'all' = 'song'): Promise<SearchResult[]> {
    try {
      let params = '';
      if (type === 'song') params = 'Eg-KAQwIARAO';
      if (type === 'album') params = 'Eg-KAQwIARAB';
      if (type === 'artist') params = 'Eg-KAQwIARAW';
      if (type === 'playlist') params = 'Eg-KAQwIARAw';

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

        // Filter out actual videos (UGC/Official Music Videos) to only return "Songs" (ATV)
        const musicVideoType = 
            renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig?.musicVideoType || 
            renderer.navigationEndpoint?.watchEndpoint?.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig?.musicVideoType;
            
        if (type === 'song' && musicVideoType && musicVideoType !== 'MUSIC_VIDEO_TYPE_ATV') {
           continue;
        }

        // 2. Extract Title
        const titleRuns = renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
        const title = titleRuns?.[0]?.text || 'Unknown Title';

        // 3. Extract Subtitle (Artist / Info)
        const subtitleRuns = renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        let subtitle = 'Unknown';
        let durationMs = 0;
        
        if (subtitleRuns.length > 0) {
          subtitle = subtitleRuns.map((r: any) => r.text).join('').replace(/•/g, '').trim();
          
          // Try to extract duration from the last run if it looks like mm:ss
          const lastRunText = subtitleRuns[subtitleRuns.length - 1]?.text;
          if (lastRunText && /^\d+:\d{2}$/.test(lastRunText)) {
            const parts = lastRunText.split(':');
            durationMs = (parseInt(parts[0]) * 60 + parseInt(parts[1])) * 1000;
            // Clean up subtitle by removing the duration and trailing separators
            subtitle = subtitle.replace(lastRunText, '').replace(/•/g, '').trim();
          }
        }

        // 4. Extract Thumbnail
        const thumbnailUrl = getHighResThumbnail(renderer.thumbnail?.musicThumbnailRenderer?.thumbnail);

        // Push to results
        results.push({
          videoId: type === 'song' ? id : undefined,
          id: type !== 'song' ? id : undefined,
          title: title,
          channelTitle: subtitle, 
          thumbnailUrl: thumbnailUrl,
          type: type,
          durationMs: durationMs,
        });
      }

      return results;

    } catch (error) {
      console.error('[YouTubeSearchService] Error:', error);
      return [];
    }
  }
}
