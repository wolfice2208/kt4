/** Журнал принятых SSE-событий с временными метками. */
export default function EventLog({ entries }) {
  return (
    <section className="card card--log" aria-labelledby="log-title">
      <div className="card__head">
        <h2 id="log-title">События SSE</h2>
        <span className="counter">{entries.length}</span>
      </div>

      {entries.length === 0 ? (
        <p className="log__empty">Ожидание событий от сервера…</p>
      ) : (
        <ul className="log" aria-live="polite">
          {entries.map((entry) => (
            <li key={entry.id} className={`log__row log__row--${entry.level}`}>
              <time className="log__time">{entry.time}</time>
              <span className="log__level">{entry.level}</span>
              <span className="log__text">{entry.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
