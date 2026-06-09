import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room?.code || (room.status !== "playing" && room.status !== "results")) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void roomStore.fetchRoom();
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room?.code, room?.status, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.viewerRole === "drawer";
  const isPlaying = room.status === "playing";
  const roleLabel =
    room.status === "results"
      ? "Round complete"
      : isDrawer
        ? "You are the drawer"
        : "You are guessing";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores} />
          <GuessHistory guesses={room.guesses} />
          <ResultPanel
            status={room.status}
            secretWord={room.secretWord}
            participants={room.participants}
            scores={room.scores}
            guesses={room.guesses}
          />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              strokes={room.canvasStrokes}
              canDraw={isDrawer && isPlaying}
              onStrokeComplete={async (stroke) => {
                await roomStore.addCanvasStroke(stroke);
              }}
              onClear={async () => {
                await roomStore.clearCanvas();
              }}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{roleLabel}</dd>
              </div>
              {isPlaying && isDrawer && room.secretWord ? (
                <div>
                  <dt>Secret word</dt>
                  <dd>{room.secretWord}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm
              disabled={isDrawer || !isPlaying}
              onSubmitGuess={async (guess) => {
                await roomStore.submitGuess(guess);
              }}
            />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
