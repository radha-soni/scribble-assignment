import { Card } from "./Card";
import type { GuessEntry } from "../services/api";

interface GuessHistoryProps {
  guesses: GuessEntry[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  return (
    <Card title="Guess History">
      {guesses.length === 0 ? (
        <p className="guess-history__empty">No guesses yet.</p>
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
