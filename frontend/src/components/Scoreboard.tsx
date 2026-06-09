import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  const rows = participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    score: scores[participant.id] ?? 0
  }));

  return (
    <Card title="Scoreboard">
      {rows.length === 0 ? (
        <p className="scoreboard__empty">Waiting for players...</p>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          {rows.map((row) => (
            <div className="placeholder-row" key={row.id}>
              <span>{row.name}</span>
              <strong>{row.score}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
