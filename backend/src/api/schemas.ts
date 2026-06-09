import { z } from "zod";

const roomCodeSchema = z
  .string()
  .trim()
  .min(1, { message: "Enter a room code." })
  .length(4, { message: "Room code must be 4 characters." })
  .regex(/^[a-z0-9]{4}$/i, { message: "Room code must use only letters and numbers." })
  .transform((value) => value.toUpperCase());

export const createRoomSchema = z.object({
  playerName: z.string().optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional()
});

export const roomCodeParamsSchema = z.object({
  code: roomCodeSchema
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
