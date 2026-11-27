"""SSE-сервер: отдаёт прогресс условной задачи через Server-Sent Events.

Эндпоинт GET /api/progress/stream присылает 5 именованных событий ``progress``
с нарастающим процентом (20, 40, 60, 80, 100) и финальное событие ``complete``.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

logger = logging.getLogger("sse_progress")

# Шаги задачи: процент и текст сообщения.
STEPS: tuple[tuple[int, str], ...] = (
    (20, "Чтение исходных данных"),
    (40, "Проверка и нормализация"),
    (60, "Основная обработка"),
    (80, "Формирование результата"),
    (100, "Сохранение результата"),
)

STEP_DELAY_SECONDS = 0.8  # пауза между событиями, чтобы прогресс был виден


app = FastAPI(title="SSE Progress Demo", version="1.0.0")

# Разрешаем запросы с dev-сервера React (Vite).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5180",
        "http://127.0.0.1:5180",
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def sse_event(event: str, payload: dict, event_id: str | None = None) -> dict:
    """Собирает словарь события для EventSourceResponse (sse-starlette сам
    добавит префиксы ``event:``, ``data:``, ``id:`` и двойной перевод строки)."""
    return {
        "event": event,
        "id": event_id,
        "data": json.dumps(payload, ensure_ascii=False),
    }


async def progress_generator(request: Request) -> AsyncIterator[dict]:
    """Генератор SSE-событий: 5 progress + 1 complete."""
    for index, (percent, message) in enumerate(STEPS, start=1):
        if await request.is_disconnected():
            logger.info("Клиент отключился до шага %s%%", percent)
            return
        await asyncio.sleep(STEP_DELAY_SECONDS)
        yield sse_event(
            "progress",
            {
                "percent": percent,
                "step": index,
                "total_steps": len(STEPS),
                "message": message,
            },
            event_id=str(index),
        )

    yield sse_event(
        "complete",
        {
            "percent": 100,
            "message": "Задача выполнена",
            "result": {
                "processed_records": 1_280,
                "duration_seconds": round(len(STEPS) * STEP_DELAY_SECONDS, 2),
            },
        },
        event_id="complete",
    )


@app.get("/api/health")
async def health() -> dict:
    """Проверка доступности backend."""
    return {"status": "ok", "service": "sse-progress-demo"}


@app.get("/api/progress/stream")
async def progress_stream(request: Request) -> EventSourceResponse:
    """Отдаёт поток SSE с прогрессом выполнения задачи."""
    return EventSourceResponse(
        progress_generator(request),
        ping=15,  # keep-alive комментарий раз в 15 секунд
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # отключаем буферизацию в nginx
        },
    )
