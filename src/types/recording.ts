/**
 * Контракты данных записи. Повторяют форму, которую отдаст backend.
 * Когда CTO подключит реальные эндпоинты — эти типы остаются, меняется
 * только реализация в src/services/api.
 */

/** Статусы pipeline обработки (спека: uploading → transcribing → summarizing → ready/failed). */
export type ProcessingStatus =
  | 'uploading'
  | 'transcribing'
  | 'summarizing'
  | 'ready'
  | 'failed';

export interface Speaker {
  id: string;
  /** Отображаемое имя. По умолчанию "Спикер N", пользователь может переименовать. */
  label: string;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  /** Начало сегмента в секундах от старта аудио. */
  start: number;
  end: number;
  text: string;
}

/** Структурная заметка саммари: заголовок пункта + под-пункты. */
export interface SummaryNote {
  title: string;
  points: string[];
}

/** Саммари из summarize-job (спека: темы, решения, action items). */
export interface Summary {
  theme: string;
  keywords: string[];
  nextSteps: string[];
  conclusion?: string;
  /** Развёрнутые заметки встречи (нумерованные с под-пунктами). */
  notes?: SummaryNote[];
}

/** Запись в списке (без тяжёлого контента). */
export interface Recording {
  id: string;
  title: string;
  /** ISO 8601. */
  createdAt: string;
  durationSec: number;
  status: ProcessingStatus;
  /** Прогресс обработки 0..1 (для processing-состояния). */
  progress?: number;
  /** Отправлена ли в Inbox веб-приложения Modus. */
  sentToInbox: boolean;
  tags?: string[];
}

/** Полная запись с плеером, транскриптом и саммари. */
export interface RecordingDetail extends Recording {
  audioUrl: string;
  speakers: Speaker[];
  segments: TranscriptSegment[];
  summary?: Summary;
}

/** Что именно выгружаем файлом при шеринге. */
export type ExportKind = 'audio' | 'transcript' | 'summary';

/** Тело запроса на переименование записи/спикеров. */
export interface RecordingPatch {
  title?: string;
  /** Мапа speakerId → новое имя. */
  speakers?: Record<string, string>;
}
