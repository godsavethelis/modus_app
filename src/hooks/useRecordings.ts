/** React Query хуки над мок-API записей. */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { ExportKind, Recording, RecordingPatch } from '@/types';
import { recordingsApi, transcribeApi } from '@/services/api';

type RecordingsPage = { items: Recording[]; nextPage: number | null };

const keys = {
  list: ['recordings'] as const,
  detail: (id: string) => ['recordings', id] as const,
};

/** Бесконечная подгрузка записей по страницам (по 15). */
export function useInfiniteRecordings(pageSize = 15) {
  return useInfiniteQuery({
    queryKey: ['recordings', 'infinite', pageSize],
    queryFn: ({ pageParam }) => recordingsApi.listRecordingsPage(pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
  });
}

export function useRecording(id: string) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => recordingsApi.getRecording(id),
    enabled: !!id,
  });
}

/** Порядок фото в ленте — просмотрщик листает по нему свайпом. */
export function usePhotoIds() {
  return useQuery({
    queryKey: ['photo-ids'],
    queryFn: () => recordingsApi.listPhotoIds(),
    staleTime: 60_000,
  });
}

/**
 * Опрос статуса обработки записи (для карточки с полоской прогресса).
 * Крутится, пока запись не станет ready/failed, затем обновляет список.
 */
export function useProcessingStatus(id: string, enabled: boolean) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['transcribe-status', id],
    queryFn: async () => {
      const res = await transcribeApi.getStatus(id);
      if (res.status === 'ready' || res.status === 'failed') {
        qc.invalidateQueries({ queryKey: keys.list });
      }
      return res;
    },
    enabled,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'ready' || s === 'failed' ? false : 1200;
    },
    // Обработка идёт на сервере — опрашиваем и когда вкладка/приложение в фоне.
    refetchIntervalInBackground: true,
  });
}

/** Выгрузка записи файлом: аудио, транскрипт или саммари. */
export function useExportRecording(id: string) {
  return useMutation({
    mutationFn: (kind: ExportKind) => recordingsApi.exportRecording(id, kind),
  });
}

export function usePatchRecording(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: RecordingPatch) => recordingsApi.patchRecording(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: keys.list });
    },
  });
}

/**
 * Переименование из списка: id приходит в mutate, а не в хук, — на главной
 * переименовать можно любую карточку, не открывая её.
 *
 * Заголовок подменяется оптимистично: иначе на моке карточка обновилась бы
 * только после перезапроса всех загруженных страниц.
 */
export function useRenameRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => recordingsApi.patchRecording(id, { title }),
    onMutate: async ({ id, title }) => {
      await qc.cancelQueries({ queryKey: keys.list });
      qc.setQueriesData<InfiniteData<RecordingsPage>>({ queryKey: ['recordings', 'infinite'] }, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((p) => ({ ...p, items: p.items.map((r) => (r.id === id ? { ...r, title } : r)) })),
            }
          : old,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.list }),
  });
}

export function useDeleteRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordingsApi.deleteRecording(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list }),
  });
}

/** Перезапуск упавшей обработки. Сбрасывает и опрос статуса, и данные записи. */
export function useRetryProcessing(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => transcribeApi.retryProcessing(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['transcribe-status', id] });
      qc.invalidateQueries({ queryKey: keys.list });
    },
  });
}

/**
 * Кнопка «Сгенерировать»: запускает расшифровку, следом собирается саммари.
 * Опрос статуса начинаем с чистого листа, иначе он останется на ready.
 */
export function useStartGeneration(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => transcribeApi.startTranscription(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['transcribe-status', id] });
      qc.invalidateQueries({ queryKey: keys.list });
    },
  });
}

export function useRegenerateSummary(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => transcribeApi.regenerateSummary(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(id) }),
  });
}
