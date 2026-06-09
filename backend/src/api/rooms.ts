import { Router } from "express";
import {
  addCanvasStrokeSchema,
  clearCanvasSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  restartGameSchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  addCanvasStroke,
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code, playerName);

      if (!result) {
        throw new HttpError(404, "Room not found. Check the code and try again.");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code);

      if (!room) {
        throw new HttpError(404, "Room not found.");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code, participantId);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found.");
        }

        if (result.reason === "not_host") {
          throw new HttpError(403, "Only the host can start the game.");
        }

        if (result.reason === "not_in_lobby") {
          throw new HttpError(409, "The game can only be started from the lobby.");
        }

        throw new HttpError(409, "At least 2 players are required to start the game.");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = addCanvasStrokeSchema.parse(request.body);
      const result = addCanvasStroke(code, participantId, stroke);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found.");
        }

        if (result.reason === "not_playing") {
          throw new HttpError(409, "Drawing is only available during an active game.");
        }

        if (result.reason === "unknown_participant") {
          throw new HttpError(404, "Participant not found in this room.");
        }

        throw new HttpError(403, "Only the drawer can draw on the canvas.");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const result = clearCanvas(code, participantId);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found.");
        }

        if (result.reason === "not_playing") {
          throw new HttpError(409, "Drawing is only available during an active game.");
        }

        if (result.reason === "unknown_participant") {
          throw new HttpError(404, "Participant not found in this room.");
        }

        throw new HttpError(403, "Only the drawer can clear the canvas.");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code, participantId, guess);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found.");
        }

        if (result.reason === "not_playing") {
          throw new HttpError(409, "Guessing is only available during an active game.");
        }

        if (result.reason === "unknown_participant") {
          throw new HttpError(404, "Participant not found in this room.");
        }

        if (result.reason === "drawer_cannot_guess") {
          throw new HttpError(403, "The drawer cannot submit guesses.");
        }

        if (result.reason === "empty_guess") {
          throw new HttpError(400, "Enter a guess.");
        }

        throw new HttpError(400, "Unable to submit guess.");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartGameSchema.parse(request.body);
      const result = restartGame(code, participantId);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found.");
        }

        if (result.reason === "unknown_participant") {
          throw new HttpError(404, "Participant not found in this room.");
        }

        if (result.reason === "not_host") {
          throw new HttpError(403, "Only the host can restart the game.");
        }

        throw new HttpError(409, "The game can only be restarted from results.");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
