/**
 * «Назад» с запасным выходом. После перезагрузки страницы или перехода по
 * прямой ссылке истории навигации нет, и router.back() молча не срабатывает —
 * в этом случае уводим на главный экран.
 */
import type { Router } from 'expo-router';

export function goBack(router: Router): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
