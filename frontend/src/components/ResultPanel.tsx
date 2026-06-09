import { Card } from "./Card";
import type { GuessEntry, Participant } from "../services/api";

interface ResultPanelProps {
  status: "lobby" | "playing" | "results";
  secretWord?: string;
  participants: Participant[];
  scores: Record<string, number>;
  guesses: GuessEntry[];
}

export function ResultPanel({ status, secretWord, participants, scores, guesses }: ResultPanelProps) {
  if (status !== "results") {
    return (
      <Card title="Results">
        <p className="result-panel__pending">Results will appear here when the round ends.</p>
      </Card>
    );
  }

  return (
    <Card title="Round Results">
      <dl className="detail-list result-panel">
        <div>
          <dt>Correct word</dt>
          <dd>{secretWord ?? "Unknown"}</dd>
        </div>
      </dl>

      <h3 className="result-panel__heading">Final scores</h3>
      <ul className="result-panel__scores">
        {participants.map((participant) => (
          <li key={participant.id}>
            <span>{participant.name}</span>
            <strong>{scores[participant.id] ?? 0}</strong>
          </li>
        ))}
      </ul>

      <h3 className="result-panel__heading">Guess history</h3>
      {guesses.length === 0 ? (
        <p className="result-panel__pending">No guesses were submitted.</p>
      ) : (
        <ul className="guess-history">
          {guesses.map((entry) => (
            <li key={entry.id} className="guess-history__item">
              <span className="guess-history__player">{entry.participantName}</span>
              <span className="guess-history__guess">{entry.guess}</span>
              <span className={`guess-history__result ${entry.isCorrect ? "guess-history__result--correct" : ""}`}>
                {entry.isCorrect ? "Correct" : "Incorrect"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
