/**
 * Мок-плеер: имитирует воспроизведение (позиция ползёт во времени, play/pause, seek).
 * TODO(recorder): заменить на реальный expo-audio player, интерфейс сохранить.
 */
import { useCallback, useEffect, useState } from 'react';

export function useMockPlayer(durationSec: number) {
  const [positionSec, setPositionSec] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPositionSec((p) => Math.min(durationSec, p + 0.25));
    }, 250);
    return () => clearInterval(id);
  }, [playing, durationSec]);

  // Дошли до конца — стоп.
  useEffect(() => {
    if (playing && positionSec >= durationSec) setPlaying(false);
  }, [playing, positionSec, durationSec]);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && positionSec >= durationSec) setPositionSec(0);
      return !p;
    });
  }, [positionSec, durationSec]);

  const seekTo = useCallback(
    (sec: number) => setPositionSec(Math.max(0, Math.min(durationSec, sec))),
    [durationSec],
  );

  const progress = durationSec > 0 ? positionSec / durationSec : 0;

  return { positionSec, playing, progress, toggle, seekTo, play: () => setPlaying(true) };
}
