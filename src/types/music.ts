export interface Track {
  videoId: string;
  title: string;
  channelTitle?: string;
  artist: string;        // We will try to extract this from the title if possible
  artistId?: string;     // Added for artist page routing
  album?: string;        // Optional, YouTube doesn't always have this
  thumbnailUrl: string;
  durationMs: number;
}

export interface SearchResult {
  videoId: string;
  title: string;
  channelTitle?: string;
  artistId?: string;
  thumbnailUrl: string;
  durationMs: number;
}

export interface PlayerState {
  currentTrack: Track | null;
}

// ── Party / Listen Along ──

// ── Party / Listen Along ──

export interface PartyProfile {
  name: string;
  avatarId: string;
}

export interface PartyMember {
  clientId: string;
  profile: PartyProfile;
  isHost: boolean;
  joinedAt: number;
}

export interface PartyPermissions {
  allowGuestAdditions: boolean;
}

export interface PartyQueueState {
  queue: Track[];
  currentIndex: number;
}

export type PartyCommandAction = "ADD_TRACK" | "PLAY_NEXT" | "PLAY_NOW";
export type PartyAdminAction = "KICK" | "TRANSFER_HOST";

export interface SyncPayload {
  currentTrack: Track | null;
  isPlaying: boolean;
  positionMs: number;
  timestamp: number;
  queue: Track[];
  currentIndex: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface PartyEvent {
  type: "SYNC" | "CHAT" | "COMMAND" | "ADMIN" | "NTP_REQUEST" | "NTP_RESPONSE" | "QUEUE_REORDER";
  syncPayload?: SyncPayload;
  chatMessage?: ChatMessage;
  commandPayload?: {
    action: PartyCommandAction;
    track: Track;
    senderId: string;
  };
  adminPayload?: {
    action: PartyAdminAction;
    targetClientId: string;
  };
  ntpPayload?: {
    clientId: string;
    t0: number;
    t1?: number;
    t2?: number;
  };
  queuePayload?: {
    queue: Track[];
    currentIndex: number;
  };
}
