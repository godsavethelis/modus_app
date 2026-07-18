/**
 * Mobile recording CRUD API (спека, требует реализации на бэкенде):
 *   POST   /api/mobile/recording/upload
 *   GET    /api/mobile/recording/list
 *   GET    /api/mobile/recording/:id
 *   PATCH  /api/mobile/recording/:id
 *   DELETE /api/mobile/recording/:id
 *   POST   /api/mobile/recording/:id/send-inbox
 */
import type { ExportKind, Recording, RecordingDetail, RecordingPatch } from '@/types';
import { makePhotoTitle, mockRecordings } from '../mocks/data';
import { delay, maybeFail } from './client';

function toListItem(r: RecordingDetail): Recording {
  const { audioUrl, speakers, segments, summary, ...rest } = r;
  return rest;
}

/**
 * Постраничная выдача записей (для бесконечного скролла).
 * TODO(backend): GET /api/mobile/recording/list?page=&pageSize=
 */
export async function listRecordingsPage(
  page: number,
  pageSize = 15,
): Promise<{ items: Recording[]; nextPage: number | null }> {
  await delay(page === 0 ? 600 : 1600);
  maybeFail(0.3);
  const all = mockRecordings
    .map(toListItem)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const start = page * pageSize;
  const items = all.slice(start, start + pageSize);
  const nextPage = start + pageSize < all.length ? page + 1 : null;
  return { items, nextPage };
}

export async function getRecording(id: string): Promise<RecordingDetail> {
  await delay();
  // TODO(backend): GET /api/mobile/recording/:id
  const found = mockRecordings.find((r) => r.id === id);
  if (!found) throw new Error(`Запись ${id} не найдена`);
  return found;
}

/** Загрузка локального аудио (multipart) и создание записи. */
export async function uploadRecording(localUri: string, durationSec: number): Promise<RecordingDetail> {
  await delay(1000);
  // TODO(backend): POST /api/mobile/recording/upload (multipart)
  const created: RecordingDetail = {
    id: `r_${Date.now()}`,
    title: `Запись ${new Date().toLocaleDateString('ru-RU')}`,
    createdAt: new Date().toISOString(),
    durationSec,
    status: 'uploading',
    progress: 0,
    sentToInbox: false,
    audioUrl: localUri,
    speakers: [],
    segments: [],
  };
  mockRecordings.unshift(created);
  return created;
}

/**
 * Отправка фото в библиотеку: каждое становится отдельным артефактом
 * со стадией uploading → ready (карточка в ленте показывает прогресс).
 */
export async function uploadPhotos(
  photos: { photoUrl: string; thumbUrl: string }[],
): Promise<RecordingDetail[]> {
  await delay(700);
  // TODO(backend): POST /api/mobile/photo/upload (multipart, по файлу на артефакт)
  const now = Date.now();
  const created = photos.map((p, i): RecordingDetail => ({
    id: `p_${now}_${i}`,
    title: makePhotoTitle(new Date(now)),
    createdAt: new Date(now - i).toISOString(),
    durationSec: 0,
    status: 'uploading',
    progress: 0,
    sentToInbox: false,
    kind: 'photo',
    photoUrl: p.photoUrl,
    thumbUrl: p.thumbUrl,
    sizeMb: Math.round((1.2 + Math.random() * 2.6) * 10) / 10,
    audioUrl: '',
    speakers: [],
    segments: [],
  }));
  mockRecordings.unshift(...created);
  return created;
}

export async function patchRecording(id: string, patch: RecordingPatch): Promise<RecordingDetail> {
  await delay(400);
  // TODO(backend): PATCH /api/mobile/recording/:id
  const rec = mockRecordings.find((r) => r.id === id);
  if (!rec) throw new Error(`Запись ${id} не найдена`);
  if (patch.title !== undefined) rec.title = patch.title;
  if (patch.speakers) {
    for (const speaker of rec.speakers) {
      const next = patch.speakers[speaker.id];
      if (next) speaker.label = next;
    }
  }
  return rec;
}

export async function deleteRecording(id: string): Promise<void> {
  await delay(400);
  // TODO(backend): DELETE /api/mobile/recording/:id
  const idx = mockRecordings.findIndex((r) => r.id === id);
  if (idx >= 0) mockRecordings.splice(idx, 1);
}

/**
 * Ручная отправка в Inbox. UI её не вызывает: готовый текст уезжает в Modus
 * сам, как только summarize-job закончил (см. transcribe.getStatus).
 * Оставлено как точка входа для бэкенда, если понадобится переотправка.
 */
export async function sendToInbox(id: string): Promise<RecordingDetail> {
  await delay(700);
  // TODO(backend): POST /api/mobile/recording/:id/send-inbox
  const rec = mockRecordings.find((r) => r.id === id);
  if (!rec) throw new Error(`Запись ${id} не найдена`);
  rec.sentToInbox = true;
  return rec;
}

/** Публичная ссылка на запись — для кнопки «Поделиться → Ссылка». */
export async function createShareLink(id: string): Promise<string> {
  await delay(500);
  // TODO(backend): POST /api/mobile/recording/:id/share
  const rec = mockRecordings.find((r) => r.id === id);
  if (!rec) throw new Error(`Запись ${id} не найдена`);
  return `https://app.modus.app/r/${id}`;
}

/** Экспорт записи файлом. Возвращает адрес готового файла. */
export async function exportRecording(id: string, kind: ExportKind): Promise<string> {
  await delay(900);
  // TODO(backend): GET /api/mobile/recording/:id/export?kind=audio|transcript|summary
  const rec = mockRecordings.find((r) => r.id === id);
  if (!rec) throw new Error(`Запись ${id} не найдена`);
  return kind === 'audio' ? rec.audioUrl : `mock://export/${id}.${kind}.txt`;
}
