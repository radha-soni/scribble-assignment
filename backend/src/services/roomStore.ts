import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name: string) {
  return name.trim();
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function pickDeterministicWord(roomCode: string) {
  const score = Array.from(roomCode).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = score % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    drawerParticipantId: null,
    secretWord: null,
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function startGame(code: string, requesterParticipantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (requesterParticipantId !== room.hostParticipantId) {
    return { ok: false as const, reason: "not_host" as const };
  }

  if (room.participants.length < 2) {
    return { ok: false as const, reason: "not_enough_players" as const };
  }

  const fallbackDrawerId = room.participants[0]?.id ?? null;
  room.drawerParticipantId = room.hostParticipantId || fallbackDrawerId;
  room.secretWord = pickDeterministicWord(room.code);
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawerViewer = Boolean(
    viewerParticipantId && room.drawerParticipantId && viewerParticipantId === room.drawerParticipantId
  );

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    drawerParticipantId: room.drawerParticipantId,
    viewerRole: isDrawerViewer ? "drawer" : "guesser",
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (isDrawerViewer && room.secretWord) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}
