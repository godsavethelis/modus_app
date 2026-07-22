/**
 * «Погружённый» экран — тот, что всегда тёмный независимо от темы приложения
 * (сейчас это лайтбокс фото). Системному хрому нужно знать о таком экране:
 * на нативе статус-бар переключается в светлые иконки, на вебе то же делает
 * нарисованный статус-бар в рамке телефона (WebPhoneFrame).
 *
 * Экран объявляет себя вызовом useImmersiveScreen(); флаг снимается сам при
 * уходе с экрана.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface ImmersiveValue {
  immersive: boolean;
  setImmersive: (v: boolean) => void;
}

const ImmersiveContext = createContext<ImmersiveValue | undefined>(undefined);

export function ImmersiveProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false);
  const value = useMemo(() => ({ immersive, setImmersive }), [immersive]);
  return <ImmersiveContext.Provider value={value}>{children}</ImmersiveContext.Provider>;
}

export function useImmersive(): ImmersiveValue {
  const ctx = useContext(ImmersiveContext);
  if (!ctx) throw new Error('useImmersive должен использоваться внутри ImmersiveProvider');
  return ctx;
}

/** Помечает экран тёмным на всё время его жизни. */
export function useImmersiveScreen() {
  const { setImmersive } = useImmersive();
  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);
}
