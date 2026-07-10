/**
 * Transcribe/summarize pipeline (спека, реюз существующих эндпоинтов modus):
 *   POST /api/modus/transcribe/start
 *   GET  /api/modus/transcribe/status
 *   POST /api/modus/summarize/regenerate
 */
import type { ProcessingStatus, Summary } from '@/types';
import { makeMockSummary, mockRecordings, newRecordingSegments, newRecordingSpeakers } from '../mocks/data';
import { delay } from './client';

/** Прогресс стадии — для полоски в карточке и на экране генерации. */
const PROGRESS: Record<ProcessingStatus, number> = {
  uploading: 0.15,
  transcribing: 0.45,
  summarizing: 0.8,
  ready: 1,
  failed: 0,
};

/**
 * Следующая стадия конвейера. Загрузка заканчивается на ready: ни транскрипта,
 * ни саммари сама она не делает. Расшифровку и саммари запускает пользователь
 * кнопкой «Сгенерировать» — тогда идёт transcribing → summarizing → ready.
 */
const NEXT: Partial<Record<ProcessingStatus, ProcessingStatus>> = {
  uploading: 'ready',
  transcribing: 'summarizing',
  summarizing: 'ready',
};

/** Пользователь нажал «Сгенерировать»: расшифровываем аудио, следом собираем саммари. */
export async function startTranscription(id: string): Promise<void> {
  await delay(300);
  // TODO(backend): POST /api/modus/transcribe/start
  const rec = mockRecordings.find((r) => r.id === id);
  if (!rec) throw new Error(`Запись ${id} не найдена`);
  rec.status = 'transcribing';
  rec.progress = PROGRESS.transcribing;
}

/**
 * Статус обработки. В прототипе продвигает стадию на каждый опрос и по пути
 * наполняет запись: транскрипт готов к стадии summarizing, саммари — к ready.
 */
export async function getStatus(id: string): Promise<{ status: ProcessingStatus; progress: number }> {
  await delay(700);
  // TODO(backend): GET /api/modus/transcribe/status
  const rec = mockRecordings.find((r) => r.id === id);
  if (!rec) throw new Error(`Запись ${id} не найдена`);

  const next = NEXT[rec.status];
  if (next) {
    rec.status = next;
    rec.progress = PROGRESS[next];

    if (next === 'summarizing' && rec.segments.length === 0) {
      rec.speakers = newRecordingSpeakers.map((s) => ({ ...s }));
      rec.segments = newRecordingSegments.map((s) => ({ ...s }));
    }
    // Из uploading в ready приходим без транскрипта — саммари тогда не делаем.
    if (next === 'ready' && rec.segments.length > 0 && !rec.summary) {
      rec.summary = makeMockSummary();
      // Готовый текст сразу уезжает в Inbox веб-приложения — руками не отправляем.
      // TODO(backend): это делает summarize-job; клиенту останется показать статус.
      rec.sentToInbox = true;
    }
  }
  return { status: rec.status, progress: rec.progress ?? 1 };
}

export async function regenerateSummary(id: string): Promise<Summary> {
  await delay(1200);
  // TODO(backend): POST /api/modus/summarize/regenerate
  const rec = mockRecordings.find((r) => r.id === id);
  if (!rec?.summary) throw new Error('Нет саммари для перегенерации');
  return rec.summary;
}

/** Ретрай упавшей обработки — запускает расшифровку заново. */
export async function retryProcessing(id: string): Promise<void> {
  await delay(300);
  // TODO(backend): POST /api/modus/transcribe/start
  const rec = mockRecordings.find((r) => r.id === id);
  if (!rec) throw new Error(`Запись ${id} не найдена`);
  rec.status = 'transcribing';
  rec.progress = PROGRESS.transcribing;
}
