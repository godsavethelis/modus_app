/**
 * Transcribe/summarize pipeline (спека, реюз существующих эндпоинтов modus):
 *   POST /api/modus/transcribe/start
 *   GET  /api/modus/transcribe/status
 *   POST /api/modus/summarize/regenerate
 */
import type { ProcessingStatus, RecordingDetail, Summary } from '@/types';
import { mockRecordings } from '../mocks/data';
import { delay } from './client';

/** Последовательность стадий обработки для мок-«прогресса». */
const STAGES: ProcessingStatus[] = ['uploading', 'transcribing', 'summarizing', 'ready'];

export async function startTranscription(id: string): Promise<void> {
  await delay(300);
  // TODO(backend): POST /api/modus/transcribe/start
  const rec = mockRecordings.find((r) => r.id === id);
  if (rec) {
    rec.status = 'uploading';
    rec.progress = 0;
  }
}

/**
 * Статус обработки. В прототипе продвигает стадию на каждый опрос,
 * имитируя реальный pipeline uploading → transcribing → summarizing → ready.
 */
export async function getStatus(id: string): Promise<{ status: ProcessingStatus; progress: number }> {
  await delay(700);
  // TODO(backend): GET /api/modus/transcribe/status
  const rec = mockRecordings.find((r) => r.id === id);
  if (!rec) throw new Error(`Запись ${id} не найдена`);

  const currentIndex = STAGES.indexOf(rec.status);
  if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
    rec.status = STAGES[currentIndex + 1];
    rec.progress = (currentIndex + 1) / (STAGES.length - 1);
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

/** Ретрай упавшей обработки. */
export async function retryProcessing(id: string): Promise<void> {
  await delay(300);
  const rec = mockRecordings.find((r) => r.id === id);
  if (rec) {
    rec.status = 'uploading';
    rec.progress = 0;
  }
}
