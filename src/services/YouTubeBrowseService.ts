import { Track } from '@/types/music';
import { getHighResThumbnail } from './YouTubeSearchService';

const BROWSE_API = 'https://music.youtube.com/youtubei/v1/browse';

const WEB_CLIENT_PAYLOAD = {
  clientName: 'WEB_REMIX',
  clientVersion: '1.20231214.00.00',
  hl: 'en',
  gl: 'US',
};

// Deep search helper
function findKeys(obj: any, key: string, results: any[] = []): any[] {
  if (typeof obj !== 'object' || obj === null) return results;
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

export interface BrowseResult {
  id: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  tracks: Track[];
}

export interface ArtistResult {
  id: string;
  name: string;
  subscribers?: string;
  thumbnailUrl: string;
  topTracks: Track[];
  albums: any[];
  singles: any[];
}

export class YouTubeBrowseService {
  static async getArtist(id: string): Promise<ArtistResult> {
    try {
      const response = await fetch(BROWSE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Origin': 'https://music.youtube.com',
          'Referer': 'https://music.youtube.com/',
        },
        body: JSON.stringify({
          context: { client: WEB_CLIENT_PAYLOAD },
          browseId: id,
        }),
      });

      if (!response.ok) throw new Error(`Artist fetch failed: ${response.status}`);
      const data = await response.json();

      let name = 'Unknown Artist';
      let subscribers = '';
      let thumbnailUrl = '';

      const header = findKeys(data, 'musicImmersiveHeaderRenderer')[0] || findKeys(data, 'musicVisualHeaderRenderer')[0];
      if (header) {
         name = header.title?.runs?.[0]?.text || name;
         subscribers = header.subscriptionButton?.subscribeButtonRenderer?.subscriberCountText?.runs?.[0]?.text || '';
         const thumb = header.thumbnail?.musicThumbnailRenderer?.thumbnail;
         thumbnailUrl = getHighResThumbnail(thumb);
      }

      const topTracks: Track[] = [];
      const albums: any[] = [];
      const singles: any[] = [];

      const shelves = findKeys(data, 'musicCarouselShelfRenderer');
      for (const shelf of shelves) {
        const title = shelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text?.toLowerCase() || '';

        if (title.includes('songs') || title.includes('tracks')) {
          const responsiveItems = findKeys(shelf, 'musicResponsiveListItemRenderer');
          for (const item of responsiveItems) {
            const videoId = item.playlistItemData?.videoId || item.navigationEndpoint?.watchEndpoint?.videoId;
            if (!videoId) continue;
            
            const flexColumns = item.flexColumns || [];
            const itemTitle = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || 'Unknown Track';
            const fixedColumns = item.fixedColumns || [];
            const durationText = fixedColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
            let durationMs = 0;
            if (durationText && /^\\d+:\\d{2}$/.test(durationText)) {
              const parts = durationText.split(':');
              durationMs = (parseInt(parts[0]) * 60 + parseInt(parts[1])) * 1000;
            }
            const itemThumb = getHighResThumbnail(item.thumbnail?.musicThumbnailRenderer?.thumbnail) || thumbnailUrl;
            
            topTracks.push({
              videoId,
              title: itemTitle,
              artist: name,
              thumbnailUrl: itemThumb,
              durationMs
            });
          }
        } else if (title.includes('albums') || title.includes('singles')) {
          const twoRowItems = findKeys(shelf, 'musicTwoRowItemRenderer');
          const itemsList = title.includes('albums') ? albums : singles;
          for (const item of twoRowItems) {
            const browseId = item.navigationEndpoint?.browseEndpoint?.browseId;
            if (!browseId) continue;
            const itemTitle = item.title?.runs?.[0]?.text || 'Unknown';
            const subtitle = item.subtitle?.runs?.map((r: any) => r.text).join('').replace(/•/g, '').trim() || '';
            const itemThumb = getHighResThumbnail(item.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail);
            
            itemsList.push({
              id: browseId,
              title: itemTitle,
              year: subtitle,
              thumbnailUrl: itemThumb
            });
          }
        }
      }

      return {
        id,
        name,
        subscribers,
        thumbnailUrl,
        topTracks,
        albums,
        singles
      };
    } catch (error) {
      console.error('[YouTubeBrowseService] Error fetching artist:', error);
      throw error;
    }
  }

  static async getAlbumOrPlaylist(id: string): Promise<BrowseResult> {
    try {
      // YouTube Music prefix for playlists is usually 'VL' for "Video List",
      // but the API handles playlist browseIds directly if we pass them correctly.
      // E.g. 'VLPL...' or just 'PL...'
      const browseId = id.startsWith('PL') || id.startsWith('RD') ? `VL${id}` : id;

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
          browseId: browseId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Browse fetch failed with status ${response.status}`);
      }

      const data = await response.json();

      // Extract Header Details
      let title = 'Unknown Title';
      let author = 'Unknown Artist';
      let thumbnailUrl = '';

      const header = findKeys(data, 'musicDetailHeaderRenderer')[0] || findKeys(data, 'musicResponsiveHeaderRenderer')[0];
      
      if (header) {
         const titleRuns = header.title?.runs;
         if (titleRuns) title = titleRuns[0]?.text;

         const subtitleRuns = header.subtitle?.runs;
         if (subtitleRuns) {
             author = subtitleRuns.map((r: any) => r.text).join('').replace(/•/g, '').trim();
         }
         
         const thumb = header.thumbnail?.croppedSquareThumbnailRenderer?.thumbnail || header.thumbnail?.musicThumbnailRenderer?.thumbnail;
         thumbnailUrl = getHighResThumbnail(thumb);
      }

      // If no thumbnail from header, check microformat
      if (!thumbnailUrl) {
         const microformat = findKeys(data, 'microformatDataRenderer')[0];
         if (microformat?.thumbnail?.thumbnails) {
            thumbnailUrl = getHighResThumbnail(microformat.thumbnail);
         }
      }

      // Extract Tracks
      const tracks: Track[] = [];
      const renderers = findKeys(data, 'musicResponsiveListItemRenderer');
      
      for (const item of renderers) {
          const videoId = item.playlistItemData?.videoId || item.navigationEndpoint?.watchEndpoint?.videoId;
          if (!videoId) continue;

          // For album tracks, the title is usually in the first flex column, but sometimes second if index is first
          let itemTitle = 'Unknown Track';
          let itemAuthor = author; // Default to album author
          let durationMs = 0;

          // Extract title
          const flexColumns = item.flexColumns || [];
          itemTitle = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || itemTitle;

          // Extract author (if it's a playlist, it might be in column 1)
          if (flexColumns.length > 1) {
              const runTexts = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((r: any) => r.text) || [];
              if (runTexts.length > 0) {
                 itemAuthor = runTexts.join('').replace(/•/g, '').trim();
              }
          }

          // Extract Duration from fixedColumns
          const fixedColumns = item.fixedColumns || [];
          const durationText = fixedColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
          
          if (durationText && /^\\d+:\\d{2}$/.test(durationText)) {
            const parts = durationText.split(':');
            durationMs = (parseInt(parts[0]) * 60 + parseInt(parts[1])) * 1000;
          }

          const itemThumb = getHighResThumbnail(item.thumbnail?.musicThumbnailRenderer?.thumbnail) || thumbnailUrl;

          tracks.push({
              videoId,
              title: itemTitle,
              artist: itemAuthor,
              thumbnailUrl: itemThumb,
              durationMs
          });
      }

      return {
          id: browseId,
          title,
          author,
          thumbnailUrl,
          tracks
      };
    } catch (error) {
      console.error('[YouTubeBrowseService] Error:', error);
      throw error;
    }
  }
}
