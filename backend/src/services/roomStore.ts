import { randomUUID } from "node:crypto";
import type { CanvasStroke, GuessEntry, Participant, Room, RoomSnapshot } from "../models/game.js";
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

function emptyCanvasStrokes(): Room["canvasStrokes"] {
  return [];
}

function emptyGuesses(): Room["guesses"] {
  return [];
}

function initialScores(participants: Participant[]): Record<string, number> {
  return Object.fromEntries(participants.map((participant) => [participant.id, 0]));
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
    canvasStrokes: emptyCanvasStrokes(),
    guesses: emptyGuesses(),
    scores: initialScores([participant]),
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
  room.scores[participant.id] = 0;
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

  if (room.status !== "lobby") {
    return { ok: false as const, reason: "not_in_lobby" as const };
  }

  const fallbackDrawerId = room.participants[0]?.id ?? null;
  room.drawerParticipantId = room.hostParticipantId || fallbackDrawerId;
  room.secretWord = pickDeterministicWord(room.code);
  room.canvasStrokes = emptyCanvasStrokes();
  room.guesses = emptyGuesses();
  room.scores = initialScores(room.participants);
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

function getPlayingRoomForParticipant(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (room.status !== "playing") {
    return { ok: false as const, reason: "not_playing" as const };
  }

  const participant = room.participants.find((entry) => entry.id === participantId);

  if (!participant) {
    return { ok: false as const, reason: "unknown_participant" as const };
  }

  if (participantId !== room.drawerParticipantId) {
    return { ok: false as const, reason: "not_drawer" as const };
  }

  return { ok: true as const, room, participant };
}

export function addCanvasStroke(code: string, participantId: string, stroke: CanvasStroke) {
  const access = getPlayingRoomForParticipant(code, participantId);

  if (!access.ok) {
    return access;
  }

  access.room.canvasStrokes.push(stroke);
  access.room.updatedAt = now();
  rooms.set(access.room.code, access.room);

  return { ok: true as const, room: cloneRoom(access.room) };
}

export function clearCanvas(code: string, participantId: string) {
  const access = getPlayingRoomForParticipant(code, participantId);

  if (!access.ok) {
    return access;
  }

  access.room.canvasStrokes = emptyCanvasStrokes();
  access.room.updatedAt = now();
  rooms.set(access.room.code, access.room);

  return { ok: true as const, room: cloneRoom(access.room) };
}

function getGuesserRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (room.status !== "playing") {
    return { ok: false as const, reason: "not_playing" as const };
  }

  const participant = room.participants.find((entry) => entry.id === participantId);

  if (!participant) {
    return { ok: false as const, reason: "unknown_participant" as const };
  }

  if (participantId === room.drawerParticipantId) {
    return { ok: false as const, reason: "drawer_cannot_guess" as const };
  }

  return { ok: true as const, room, participant };
}

export function submitGuess(code: string, participantId: string, guess: string) {
  const access = getGuesserRoom(code, participantId);

  if (!access.ok) {
    return access;
  }

  const normalizedGuess = guess.trim();

  if (!normalizedGuess) {
    return { ok: false as const, reason: "empty_guess" as const };
  }

  if (!access.room.secretWord) {
    return { ok: false as const, reason: "not_playing" as const };
  }

  const isCorrect = normalizedGuess.toLowerCase() === access.room.secretWord.toLowerCase();
  const alreadyScoredCorrectly = access.room.guesses.some(
    (existingGuess) => existingGuess.participantId === participantId && existingGuess.isCorrect
  );

  const entry: GuessEntry = {
    id: randomUUID(),
    participantId: access.participant.id,
    participantName: access.participant.name,
    guess: normalizedGuess,
    isCorrect,
    createdAt: now()
  };

  access.room.guesses.push(entry);

  if (isCorrect && !alreadyScoredCorrectly) {
    access.room.scores[access.participant.id] = (access.room.scores[access.participant.id] ?? 0) + 100;
  }

  if (isCorrect) {
    access.room.status = "results";
  }

  access.room.updatedAt = now();
  rooms.set(access.room.code, access.room);

  return { ok: true as const, room: cloneRoom(access.room), entry };
}

export function restartGame(code: string, requesterParticipantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (room.status !== "results") {
    return { ok: false as const, reason: "not_in_results" as const };
  }

  if (requesterParticipantId !== room.hostParticipantId) {
    return { ok: false as const, reason: "not_host" as const };
  }

  const participant = room.participants.find((entry) => entry.id === requesterParticipantId);

  if (!participant) {
    return { ok: false as const, reason: "unknown_participant" as const };
  }

  room.status = "lobby";
  room.drawerParticipantId = null;
  room.secretWord = null;
  room.canvasStrokes = emptyCanvasStrokes();
  room.guesses = emptyGuesses();
  room.scores = initialScores(room.participants);
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
    canvasStrokes: room.canvasStrokes.map((stroke) => ({ ...stroke, points: [...stroke.points] })),
    guesses: room.guesses.map((guess) => ({ ...guess })),
    scores: { ...room.scores },
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.secretWord && (room.status === "results" || isDrawerViewer)) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}
