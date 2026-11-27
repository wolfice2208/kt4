import { STATUS } from '../hooks/useProgressStream';

const BADGE_META = {
  [STATUS.CONNECTING]: { label: 'Подключение…', tone: 'pending' },
  [STATUS.RUNNING]: { label: 'Выполняется', tone: 'active' },
  [STATUS.DONE]: { label: 'Завершено', tone: 'done' },
  [STATUS.ERROR]: { label: 'Ошибка соединения', tone: 'error' },
};

/** Индикатор состояния SSE-соединения. */
export default function StatusBadge({ status }) {
  const meta = BADGE_META[status] ?? BADGE_META[STATUS.CONNECTING];
  return (
    <span className={`badge badge--${meta.tone}`} role="status" aria-live="polite">
      <span className="badge__dot" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
