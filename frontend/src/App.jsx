import EventLog from './components/EventLog.jsx';
import ProgressPanel from './components/ProgressPanel.jsx';
import StatusBadge from './components/StatusBadge.jsx';
import { STATUS, useProgressStream, PROGRESS_STREAM_URL } from './hooks/useProgressStream.js';

export default function App() {
  const { status, percent, step, totalSteps, message, errorMessage, log, restart } =
    useProgressStream();

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            ⟳
          </span>
          <div className="brand__text">
            <p className="brand__eyebrow">Тема 4.3 · SSE + React</p>
            <h1>Живой прогресс через EventSource</h1>
          </div>
        </div>
        <StatusBadge status={status} />
      </header>

      <main className="layout">
        <ProgressPanel
          status={status}
          percent={percent}
          step={step}
          totalSteps={totalSteps}
          message={message}
          errorMessage={errorMessage}
          onRestart={restart}
        />
        <EventLog entries={log} />
      </main>

      <footer className="footer">
        <span>
          Источник событий: <code>{PROGRESS_STREAM_URL}</code>
        </span>
        <span className={status === STATUS.ERROR ? 'footer__state footer__state--error' : 'footer__state'}>
          {status === STATUS.ERROR ? 'Нет соединения с backend' : 'Без поллинга и перезагрузки страницы'}
        </span>
      </footer>
    </div>
  );
}
