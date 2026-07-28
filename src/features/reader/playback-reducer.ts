import type { PlaybackState } from "@/types/playback";

export const initialPlaybackState: PlaybackState = { mode: "GUIDED", playing: false, autoFollow: true, rate: 1, completed: false };

type PlaybackAction =
  | { type: "SET_MODE"; mode: PlaybackState["mode"] }
  | { type: "SET_ACTIVE"; itemId?: string }
  | { type: "RESTORE_PROGRESS"; itemId?: string; completed: boolean }
  | { type: "SET_PLAYING"; playing: boolean }
  | { type: "SET_COMPLETED"; completed: boolean }
  | { type: "SET_RATE"; rate: number }
  | { type: "USER_SCROLLED_AWAY" }
  | { type: "RESTORE_AUTO_FOLLOW" };

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case "SET_MODE": return { ...state, mode: action.mode, playing: false, completed: false };
    case "SET_ACTIVE": return { ...state, activeItemId: action.itemId, completed: false };
    case "RESTORE_PROGRESS": return { ...state, activeItemId: action.itemId, completed: action.completed, playing: false };
    case "SET_PLAYING": return { ...state, playing: action.playing };
    case "SET_COMPLETED": return { ...state, completed: action.completed, playing: false };
    case "SET_RATE": return { ...state, rate: Math.min(2, Math.max(0.5, action.rate)) };
    case "USER_SCROLLED_AWAY": return { ...state, autoFollow: false };
    case "RESTORE_AUTO_FOLLOW": return { ...state, autoFollow: true };
  }
}
