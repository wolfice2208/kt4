import { STATUS } from '../hooks/useProgressStream';

const STEP_MARKS = [20, 40, 60, 80, 100];

/**
 * Карточка прогресса: полоса, проценты и кнопка перезапуска.
 * Обновляется синхронно с событиями `progress` / `complete`.
 */
export default function ProgressPanel({
  status,
  percent,
  step,
  totalSteps,
  message,
  errorMessage,
  onRestart,
}) {
  const isRunning = status === STATUS.CONNECTING || status === STATUS.RUNNING;
  const isError = status === STATUS.ERROR;

  return (
    <section className="card card--progress" aria-labelledby="progress-title">
      <div className="card__head">
        <div>
          <h2 id="progress-title">Обработка задачи</h2>
          <p className="card__hint">
            {step === 0 ? 'Ожидание событий' : `Шаг ${Math.min(step, totalSteps)} из ${totalSteps}`}
          </p>
        </div>
        <code className="endpoint">GET /api/progress/stream</code>
      </div>

      <div
        className={`progress progress--${status}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        aria-label="Прогресс выполнения задачи"
      >
        <div className="progress__fill" style={{ width: `${percent}%` }}>
          {isRunning && <span className="progress__shine" aria-hidden="true" />}
        </div>
      </div>

      <div className="progress__meta">
        <span className="progress__percent">
          {percent}
          <small>%</small>
        </span>
        <span className="progress__message">{isError ? 'Остановлено из-за ошибки' : message}</span>
      </div>

      <ol className="marks" aria-hidden="true">
        {STEP_MARKS.map((mark) => (
          <li
            key={mark}
            className={`marks__item${percent >= mark ? ' marks__item--passed' : ''}`}
          >
            <span className="marks__dot" />
            {mark}%
          </li>
        ))}
      </ol>

      {isError && (
        <div className="alert" role="alert">
          <strong>Соединение прервано.</strong> {errorMessage}
        </div>
      )}

      <div className="card__actions">
        <button type="button" className="button" onClick={onRestart} disabled={isRunning}>
          {isError ? 'Повторить запуск' : 'Запустить заново'}
        </button>
        <span className="card__note">
          Соединение закрывается автоматически после события <code>complete</code>
        </span>
      </div>
    </section>
  );
}
