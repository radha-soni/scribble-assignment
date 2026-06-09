export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "results";

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasStroke {
  id: string;
  points: CanvasPoint[];
  color: string;
  width: number;
  createdBy: string;
  createdAt: string;
}

export interface GuessEntry {
  id: string;
  participantId: string;
  participantName: string;
  guess: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  drawerParticipantId: string | null;
  secretWord: string | null;
  canvasStrokes: CanvasStroke[];
  guesses: GuessEntry[];
  scores: Record<string, number>;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  drawerParticipantId: string | null;
  viewerRole: ParticipantRole;
  secretWord?: string;
  canvasStrokes: CanvasStroke[];
  guesses: GuessEntry[];
  scores: Record<string, number>;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
