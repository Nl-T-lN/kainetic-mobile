import Ably from 'ably';
import { usePlayerStore } from '@/store/playerStore';

export const ABLY_API_KEY = 'Aszciw.QfNpZw:8N_o1Mk_qXbCX1qxPvNTtA7iUOT6DUglMBAkZCQr--A';

class AblySyncService {
    private client: Ably.Realtime | null = null;
    private channel: any = null;
    public roomId: string | null = null;
    public isHost: boolean = false;

    init(roomId: string, isHost: boolean) {
        if (!this.client) {
            this.client = new Ably.Realtime({ key: ABLY_API_KEY });
        }
        
        this.roomId = roomId;
        this.isHost = isHost;
        this.channel = this.client.channels.get(`party:${roomId}`);

        // Only guests subscribe to state updates
        if (!isHost) {
            this.channel.subscribe('sync', (message: any) => {
                const state = message.data;
                const { setCurrentTrack, setQueue, setIsPlaying } = usePlayerStore.getState();
                
                if (state.track) {
                    setCurrentTrack(state.track);
                }
                if (state.queue) {
                    setQueue(state.queue, state.currentIndex || 0);
                }
                if (state.isPlaying !== undefined) {
                    setIsPlaying(state.isPlaying);
                }
            });
        }
    }

    broadcastState() {
        if (!this.isHost || !this.channel) return;
        
        const state = usePlayerStore.getState();
        this.channel.publish('sync', {
            track: state.currentTrack,
            queue: state.queue,
            currentIndex: state.currentIndex,
            isPlaying: state.isPlaying
        });
    }

    disconnect() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel.detach();
        }
        this.roomId = null;
        this.isHost = false;
    }
}

export const ablySync = new AblySyncService();
