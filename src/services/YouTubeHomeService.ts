import { SearchResult } from '@/types/music';
import { getHighResThumbnail } from './YouTubeSearchService';

const BROWSE_API = 'https://music.youtube.com/youtubei/v1/browse';

const WEB_CLIENT_PAYLOAD = {
  clientName: 'WEB_REMIX',
  clientVersion: '1.20231214.00.00',
  hl: 'en',
  gl: 'US',
};

// Deep search helper
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

export interface HomeSection {
  title: string;
  items: SearchResult[];
}

export class YouTubeHomeService {
  /**
   * Fetches the FEmusic_home endpoint and extracts sections like Recommended Mixes and Trending
   */
  static async fetchHome(): Promise<HomeSection[]> {
    try {
      const response = await fetch(BROWSE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'X-YouTube-Client-Name': '67',
          'X-YouTube-Client-Version': WEB_CLIENT_PAYLOAD.clientVersion,
          'Origin': 'https://music.youtube.com',
          'Referer': 'https://music.youtube.com/',
        },
        body: JSON.stringify({
          context: { client: WEB_CLIENT_PAYLOAD },
          browseId: 'FEmusic_home',
        }),
      });

      if (!response.ok) {
        throw new Error(`Home fetch failed with status ${response.status}`);
      }

      const data = await response.json();
      const shelves = findKeys(data, 'musicCarouselShelfRenderer');
      const sections: HomeSection[] = [];

      for (const shelf of shelves) {
        const titleRuns = shelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs;
        const title = titleRuns?.[0]?.text;
        
        if (!title) continue;

        const items: SearchResult[] = [];
        
        // Parse TwoRow items (Playlists, Mixes, Artists, Albums)
        const twoRowItems = findKeys(shelf, 'musicTwoRowItemRenderer');
        for (const item of twoRowItems) {
            const browseId = item.navigationEndpoint?.browseEndpoint?.browseId;
            const videoId = item.navigationEndpoint?.watchEndpoint?.videoId;
            const playlistId = item.thumbnailOverlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchPlaylistEndpoint?.playlistId;
            
            const id = browseId || videoId;
            if (!id) continue;

            const itemTitle = item.title?.runs?.[0]?.text || 'Unknown';
            const subtitle = item.subtitle?.runs?.map((r: any) => r.text).join('').replace(/•/g, '').trim() || 'Unknown';
            const thumbnailUrl = getHighResThumbnail(item.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail);
            
            // Determine type
            let type: 'song' | 'playlist' | 'artist' | 'album' = 'playlist'; // Default to playlist for two-row items
            if (browseId?.startsWith('UC')) type = 'artist';
            else if (browseId?.startsWith('MPRE')) type = 'album';
            
            items.push({
                id: (playlistId || id).replace(/^VL/, ''),
                videoId: undefined,
                title: itemTitle,
                channelTitle: subtitle,
                thumbnailUrl: thumbnailUrl,
                type: type,
                durationMs: 0,
            });
        }
        
        // Parse Responsive items (Quick picks / Songs)
        const responsiveItems = findKeys(shelf, 'musicResponsiveListItemRenderer');
        for (const item of responsiveItems) {
            const videoId = item.playlistItemData?.videoId || item.navigationEndpoint?.watchEndpoint?.videoId;
            if (!videoId) continue;
            
            const itemTitle = item.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || 'Unknown Title';
            const subtitleRuns = item.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
            let subtitle = 'Unknown';
            if (subtitleRuns.length > 0) {
              subtitle = subtitleRuns.map((r: any) => r.text).join('').replace(/•/g, '').trim();
            }
            const thumbnailUrl = getHighResThumbnail(item.thumbnail?.musicThumbnailRenderer?.thumbnail);

            items.push({
                videoId: videoId,
                title: itemTitle,
                channelTitle: subtitle,
                thumbnailUrl: thumbnailUrl,
                type: 'song',
                durationMs: 0,
            });
        }

        if (items.length > 0) {
            sections.push({ title, items });
        }
      }

      return sections;
    } catch (error) {
      console.error('[YouTubeHomeService] Error:', error);
      return [];
    }
  }
}
