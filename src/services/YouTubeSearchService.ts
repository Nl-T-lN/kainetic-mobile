import { SearchResult, Track } from '@/types/music';
import { APIConfig, findKeys } from '@/config/APIConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export class YouTubeSearchService {
  static async search(query: string, type: 'song' | 'artist' | 'album' | 'playlist' | 'all' = 'song'): Promise<SearchResult[]> {
    try {
      let params = '';
      if (type === 'song') params = 'Eg-KAQwIARAO';
      if (type === 'album') params = 'Eg-KAQwIARAB';
      if (type === 'artist') params = 'Eg-KAQwIARAW';
      if (type === 'playlist') params = 'Eg-KAQwIARAw';

      const response = await fetch(APIConfig.YOUTUBE.SEARCH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'X-YouTube-Client-Name': APIConfig.YOUTUBE.WEB_CLIENT_PAYLOAD.clientName === 'WEB_REMIX' ? '67' : '1',
          'X-YouTube-Client-Version': APIConfig.YOUTUBE.WEB_CLIENT_PAYLOAD.clientVersion,
          'Origin': 'https://music.youtube.com',
          'Referer': 'https://music.youtube.com/',
        },
        body: JSON.stringify({
          context: { client: APIConfig.YOUTUBE.WEB_CLIENT_PAYLOAD },
          query: query,
          params: params ? params : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = await response.json();
      const renderers = findKeys(data, 'musicResponsiveListItemRenderer') || [];
      const results: SearchResult[] = [];

      for (const renderer of renderers) {
        let videoId = 
          renderer.playlistItemData?.videoId ||
          renderer.navigationEndpoint?.watchEndpoint?.videoId ||
          renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;

        let browseId = renderer.navigationEndpoint?.browseEndpoint?.browseId;
        
        const id = (type === 'song' || type === 'all') ? videoId : browseId;
        if (!id) continue;

        // If type is 'all', determine the type from the browse endpoint or existence of videoId
        let resultType = type;
        if (type === 'all') {
            if (browseId?.startsWith('UC')) resultType = 'artist';
            else if (browseId?.startsWith('MPRE')) resultType = 'album';
            else if (browseId?.startsWith('VL')) resultType = 'playlist';
            else if (videoId) resultType = 'song';
            else continue;
        }

        const titleRuns = renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
        const title = titleRuns?.[0]?.text || 'Unknown Title';

        const subtitleRuns = renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        let subtitle = 'Unknown';
        let durationMs = 0;
        
        if (subtitleRuns.length > 0) {
          const rawSubtitle = subtitleRuns.map((r: any) => r.text).join('');
          // Try to extract time at the end: "Artist • Album • 3:45"
          const match = rawSubtitle.match(/(.*?)\s*•\s*(\d+:\d{2})$/);
          if (match) {
            subtitle = match[1].trim();
            const timeParts = match[2].split(':');
            durationMs = (parseInt(timeParts[0]) * 60 + parseInt(timeParts[1])) * 1000;
          } else {
            subtitle = rawSubtitle;
          }
        }

        const thumbnailUrl = getHighResThumbnail(renderer.thumbnail?.musicThumbnailRenderer?.thumbnail);

        results.push({
          videoId: videoId,
          id: browseId,
          title: title,
          channelTitle: subtitle, 
          thumbnailUrl: thumbnailUrl,
          type: resultType as any,
          durationMs: durationMs,
        });
      }

      return results;

    } catch (error) {
      console.error('[YouTubeSearchService] Error:', error);
      return [];
    }
  }

  static async getUpNext(videoId: string): Promise<Track[]> {
    try {
      const response = await fetch(APIConfig.YOUTUBE.NEXT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Origin': 'https://music.youtube.com',
        },
        body: JSON.stringify({
          context: { client: APIConfig.YOUTUBE.WEB_CLIENT_PAYLOAD },
          videoId: videoId,
          playlistId: "RDAMVM" + videoId
        }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const renderers = findKeys(data, 'playlistPanelVideoRenderer') || [];
      const tracks: Track[] = [];

      for (const renderer of renderers) {
        if (!renderer.videoId) continue;
        
        const titleRuns = renderer.title?.runs || [];
        const title = titleRuns.map((r: any) => r.text).join('') || 'Unknown Title';
        
        const subtitleRuns = renderer.longBylineText?.runs || renderer.shortBylineText?.runs || [];
        let artist = 'Unknown Artist';
        if (subtitleRuns.length > 0) {
           artist = subtitleRuns.map((r: any) => r.text).join('');
        }
        
        let durationMs = 0;
        const lengthText = renderer.lengthText?.runs?.[0]?.text;
        if (lengthText && /^\d+:\d{2}$/.test(lengthText)) {
            const parts = lengthText.split(':');
            durationMs = (parseInt(parts[0]) * 60 + parseInt(parts[1])) * 1000;
        }

        tracks.push({
          videoId: renderer.videoId,
          title,
          artist,
          thumbnailUrl: getHighResThumbnail(renderer.thumbnail),
          durationMs
        });
      }

      // Filter out the seed track if it's the first one
      const finalTracks = tracks.filter(t => t.videoId !== videoId);
      
      // Cache the result for offline use
      if (finalTracks.length > 0) {
        AsyncStorage.setItem(`@kainetic:upnext_cache_${videoId}`, JSON.stringify(finalTracks)).catch(console.error);
      }

      return finalTracks;
    } catch (e) {
      console.error('[YouTubeSearchService] getUpNext Error fetching from network:', e);
      
      // Fallback to offline cache
      try {
        const cached = await AsyncStorage.getItem(`@kainetic:upnext_cache_${videoId}`);
        if (cached) {
          console.log(`[YouTubeSearchService] Serving UpNext for ${videoId} from offline cache`);
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        console.error('[YouTubeSearchService] Error reading UpNext cache:', cacheError);
      }

      return [];
    }
  }
}
