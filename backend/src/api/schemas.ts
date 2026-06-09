import { z } from "zod";

const roomCodeSchema = z
  .string()
  .trim()
  .min(1, { message: "Enter a room code." })
  .length(4, { message: "Room code must be 4 characters." })
  .regex(/^[a-z0-9]{4}$/i, { message: "Room code must use only letters and numbers." })
  .transform((value) => value.toUpperCase());

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, { message: "Enter a player name." })
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, { message: "Enter a player name." })
});

export const roomCodeParamsSchema = z.object({
  code: roomCodeSchema
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().min(1, { message: "Missing participant id." })
});

export const restartGameSchema = z.object({
  participantId: z.string().min(1, { message: "Missing participant id." })
});

const canvasPointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const canvasStrokeSchema = z.object({
  id: z.string().min(1),
  points: z.array(canvasPointSchema).min(1, { message: "Stroke must include at least one point." }),
  color: z.string().min(1),
  width: z.number().positive(),
  createdBy: z.string().min(1),
  createdAt: z.string().min(1)
});

export const addCanvasStrokeSchema = z.object({
  participantId: z.string().min(1, { message: "Missing participant id." }),
  stroke: canvasStrokeSchema
});

export const clearCanvasSchema = z.object({
  participantId: z.string().min(1, { message: "Missing participant id." })
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1, { message: "Missing participant id." }),
  guess: z.string().trim().min(1, { message: "Enter a guess." })
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
