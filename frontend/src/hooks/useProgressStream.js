import { useCallback, useEffect, useRef, useState } from 'react';

/** Статусы жизненного цикла потока. */
export const STATUS = {
  CONNECTING: 'connecting',
  RUNNING: 'running',
  DONE: 'done',
  ERROR: 'error',
};

/** Адрес SSE-эндпоинта. По умолчанию — относительный путь (через прокси Vite). */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
export const PROGRESS_STREAM_URL = `${API_BASE_URL}/api/progress/stream`;

const MAX_LOG_ENTRIES = 50;

function timestamp() {
  return new Date().toLocaleTimeString('ru-RU', { hour12: false });
}

/**
 * Подключается к SSE-эндпоинту и возвращает состояние прогресса.
 *
 * EventSource создаётся в useEffect, именованные события слушаются через
 * addEventListener, соединение закрывается и по complete, и в cleanup-функции.
 */
export function useProgressStream(url = PROGRESS_STREAM_URL) {
  const [status, setStatus] = useState(STATUS.CONNECTING);
  const [percent, setPercent] = useState(0);
  const [step, setStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(5);
  const [message, setMessage] = useState('Подключение к серверу…');
  const [errorMessage, setErrorMessage] = useState('');
  const [log, setLog] = useState([]);
  const [runId, setRunId] = useState(0);

  const appendLog = useCallback((level, text) => {
    setLog((entries) => [
      ...entries.slice(-(MAX_LOG_ENTRIES - 1)),
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: timestamp(), level, text },
    ]);
  }, []);

  useEffect(() => {
    // Сброс состояния перед каждым запуском.
    setStatus(STATUS.CONNECTING);
    setPercent(0);
    setStep(0);
    setMessage('Подключение к серверу…');
    setErrorMessage('');
    setLog([]);

    const eventSource = new EventSource(url);
    // Флаг защищает от обработки событий после явного close().
    let closed = false;

    const closeConnection = () => {
      if (closed) return;
      closed = true;
      eventSource.removeEventListener('progress', handleProgress);
      eventSource.removeEventListener('complete', handleComplete);
      eventSource.onerror = null;
      eventSource.close();
    };

    function handleProgress(event) {
      if (closed) return;
      try {
        const data = JSON.parse(event.data);
        setStatus(STATUS.RUNNING);
        setPercent(data.percent ?? 0);
        setStep(data.step ?? 0);
        setTotalSteps(data.total_steps ?? 5);
        setMessage(data.message ?? '');
        appendLog('progress', `progress ${data.percent}% — ${data.message ?? ''}`);
      } catch {
        appendLog('error', 'Не удалось разобрать событие progress');
      }
    }

    function handleComplete(event) {
      if (closed) return;
      try {
        const data = JSON.parse(event.data);
        setStatus(STATUS.DONE);
        setPercent(100);
        setStep(5);
        setMessage(data.message ?? 'Задача выполнена');
        appendLog('complete', `complete — ${data.message ?? 'готово'}`);
      } catch {
        setStatus(STATUS.DONE);
        setPercent(100);
        appendLog('complete', 'complete');
      }
      // Закрываем соединение сразу после финального события.
      closeConnection();
    }

    // Обработчик разрыва: EventSource по умолчанию переподключается сам,
    // но для наглядной ошибки мы закрываем поток и просим повторить запуск.
    eventSource.onerror = () => {
      if (closed) return;
      setStatus(STATUS.ERROR);
      setErrorMessage('Проверьте, что backend запущен, и повторите запуск.');
      appendLog('error', 'Соединение с сервером прервано');
      closeConnection();
    };

    // Именованные события: без onmessage, только addEventListener.
    eventSource.addEventListener('progress', handleProgress);
    eventSource.addEventListener('complete', handleComplete);

    return () => {
      // cleanup useEffect: закрываем EventSource при размонтировании/рестарте.
      closeConnection();
    };
  }, [url, runId, appendLog]);

  const restart = useCallback(() => {
    setRunId((value) => value + 1);
  }, []);

  return {
    status,
    percent,
    step,
    totalSteps,
    message,
    errorMessage,
    log,
    restart,
  };
}
