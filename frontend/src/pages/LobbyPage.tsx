import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room?.code) {
      return;
    }

    let isActive = true;

    async function tick() {
      try {
        await roomStore.fetchRoom();
        if (isActive) {
          setRefreshError(null);
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to refresh room";
        if (!isActive) {
          return;
        }

        setRefreshError(message);

        if (message.toLowerCase().includes("not found")) {
          navigate("/", { replace: true });
        }
      }
    }

    void tick();

    const intervalId = window.setInterval(() => {
      void tick();
    }, 2000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [navigate, room?.code, roomStore]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostParticipantId;
  const canStart = isHost && room.participants.length >= 2;
  const statusMessage =
    error ??
    refreshError ??
    (isHost
      ? room.participants.length >= 2
        ? "You can start the game when you're ready."
        : "Waiting for at least one more player to join."
      : "Waiting for the host to start the game.");

  async function handleStartGame() {
    try {
      setRefreshError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {participant.id === room.hostParticipantId ? "host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{statusMessage}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button
          className="button button--primary"
          disabled={!canStart || isLoading}
          onClick={handleStartGame}
        >
          {isHost ? (canStart ? "Start Game" : "Waiting for players...") : "Waiting for host..."}
        </button>
      </div>
    </section>
  );
}
