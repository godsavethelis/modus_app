/**
 * ХАРДКОД-ДАННЫЕ для прототипа. Весь фейковый контент живёт здесь.
 * При подключении backend этот файл удаляется, а функции в src/services/api
 * начинают ходить в реальную сеть.
 */
import type { ProcessingStatus, RecordingDetail, User } from '@/types';

export const mockUser: User = {
  id: 'u_1',
  email: 'andrey@modus.app',
  name: 'Андрей',
};

/** Пароль-заглушка для мок-логина (любой email + этот пароль пускают внутрь). */
export const MOCK_PASSWORD = '1234';

/**
 * Мок доступа к микрофону. Поставь true, чтобы увидеть экран отказа
 * (инструкция + CTA «Открыть настройки»). TODO(recorder): заменить на
 * реальный запрос разрешения через expo-audio.
 */
export const MOCK_MIC_DENIED = false;

const lectureDetail: RecordingDetail = {
  id: 'r_1',
  title: '10-03 Лекция: Триумфальная площадь, памятник Маяковскому и культурная память Москвы',
  createdAt: '2025-10-03T11:02:00.000Z',
  durationSec: 56 * 60,
  status: 'ready',
  sentToInbox: false,
  audioUrl: 'mock://audio/r_1.m4a',
  speakers: [
    { id: 's1', label: 'Спикер 1' },
    { id: 's2', label: 'Спикер 2' },
  ],
  segments: [
    { id: 'seg1', speakerId: 's1', start: 4, end: 18, text: 'Сегодня поговорим о Триумфальной площади и её месте в культурной памяти города.' },
    { id: 'seg2', speakerId: 's2', start: 19, end: 36, text: 'Особенно интересна роль памятника Маяковскому как символа свободы слова.' },
    { id: 'seg3', speakerId: 's1', start: 37, end: 52, text: 'Верно. Площадь долго была точкой притяжения для поэтических чтений.' },
    { id: 'seg4', speakerId: 's2', start: 53, end: 71, text: 'И сегодня это место продолжает объединять историческую память и современное городское пространство.' },
  ],
  summary: {
    theme:
      'Лекция посвящена истории Триумфальной площади, роли памятника Маяковскому и тому, как это место формирует культурную память Москвы.',
    keywords: ['Триумфальная площадь', 'Маяковский', 'свобода слова', 'городская среда'],
    nextSteps: [
      'Уточнить текущие культурные инициативы на площади',
      'Собрать данные о развитии архитектурного ансамбля площади',
      'Подготовить материал о роли площади в культурной памяти',
    ],
    conclusion:
      'Триумфальная площадь остаётся значимым культурным символом Москвы, объединяя современное городское пространство и историческую память.',
    notes: [
      {
        title: 'Историческое значение площади',
        points: [
          'Долгое время была точкой притяжения для поэтических чтений',
          'Тесно связана с именем Владимира Маяковского',
        ],
      },
      {
        title: 'Памятник Маяковскому',
        points: [
          'Воспринимается как символ свободы слова',
          'Место публичных выступлений и чтений',
        ],
      },
      {
        title: 'Культурная память Москвы',
        points: [
          'Площадь объединяет историческую память и современное пространство',
          'Продолжает играть роль в жизни города',
        ],
      },
    ],
  },
};

const weeklyMeeting: RecordingDetail = {
  id: 'r_2',
  title: '03-30 Weekly Meeting: Продажи, Разработка, Фандрайзинг',
  createdAt: '2025-03-30T10:09:00.000Z',
  durationSec: 116 * 60,
  status: 'ready',
  sentToInbox: true,
  audioUrl: 'mock://audio/r_2.m4a',
  speakers: [
    { id: 's1', label: 'Спикер 1' },
    { id: 's2', label: 'Спикер 2' },
  ],
  segments: [
    { id: 'seg1', speakerId: 's1', start: 2, end: 20, text: 'Начнём с продаж: закрыли квартал выше плана, дальше фокус на удержании.' },
    { id: 'seg2', speakerId: 's2', start: 21, end: 44, text: 'По разработке — мобильный диктофон в приоритете, добиваем запись и загрузку.' },
  ],
  summary: {
    theme: 'Еженедельная встреча по продажам, разработке и фандрайзингу.',
    keywords: ['продажи', 'разработка', 'фандрайзинг'],
    nextSteps: ['Подготовить питч для раунда', 'Закрыть релиз мобильного диктофона'],
    conclusion: 'Команда движется по плану, ключевой риск — сроки мобильного релиза.',
  },
};

const presentation: RecordingDetail = {
  id: 'r_3',
  title: '03-29 Презентация: Интерактивные форматы и рефлексия',
  createdAt: '2025-03-29T10:12:00.000Z',
  durationSec: 87 * 60,
  status: 'summarizing',
  progress: 0.48,
  sentToInbox: false,
  audioUrl: 'mock://audio/r_3.m4a',
  speakers: [{ id: 's1', label: 'Спикер 1' }],
  segments: [],
};

const wideShort: RecordingDetail = {
  id: 'r_4',
  title: 'wide_short',
  createdAt: '2025-09-19T16:06:00.000Z',
  durationSec: 85 * 60,
  status: 'ready',
  sentToInbox: false,
  audioUrl: 'mock://audio/r_4.m4a',
  speakers: [{ id: 's1', label: 'Спикер 1' }],
  segments: [
    { id: 'seg1', speakerId: 's1', start: 1, end: 14, text: 'Короткая тестовая запись для проверки распознавания.' },
  ],
  summary: {
    theme: 'Тестовая запись.',
    keywords: ['тест'],
    nextSteps: [],
  },
};

const failedNote: RecordingDetail = {
  id: 'r_5',
  title: 'Заметка на ходу',
  createdAt: '2025-07-01T01:47:00.000Z',
  durationSec: 47,
  status: 'failed',
  sentToInbox: false,
  audioUrl: 'mock://audio/r_5.m4a',
  speakers: [],
  segments: [],
};

// Дополнительные записи, чтобы наполнить список (для демонстрации подгрузки по страницам).
const EXTRA_TITLES = [
  'Синк по релизу мобильного приложения',
  '1:1 с продуктовой командой',
  'Ретро спринта 14',
  'Интервью с кандидатом на бэкенд',
  'Планирование Q3',
  'Звонок с инвестором',
  'Обсуждение архитектуры API',
  'Демо для клиента: онбординг',
  'Брейншторм по неймингу',
  'Разбор метрик за неделю',
  'Лекция: Основы дизайн-систем',
  'Созвон с подрядчиком по дизайну',
  'Стендап команды',
  'Обсуждение бюджета на маркетинг',
  'Питч на демо-дне',
  'Разговор с ментором',
  'Воркшоп по клиентским интервью',
  'Синк по фандрайзингу',
  'Обсуждение правок по спеке',
  'Звонок поддержки: баг с загрузкой',
  'Планёрка контент-плана',
  'Ретро по найму',
  'Обсуждение партнёрства',
  'Лекция: Введение в NLP',
  'Личные заметки по стратегии',
];

const extraRecordings: RecordingDetail[] = EXTRA_TITLES.map((title, i) => {
  const status: ProcessingStatus = i % 11 === 0 ? 'failed' : i % 7 === 0 ? 'summarizing' : 'ready';
  const date = new Date(2025, 5, Math.max(1, 25 - i), 9 + (i % 8), (i * 7) % 60);
  const isReady = status === 'ready';
  return {
    id: `r_e${i}`,
    title,
    createdAt: date.toISOString(),
    durationSec: (5 + ((i * 13) % 105)) * 60,
    status,
    progress: status === 'summarizing' ? 0.6 : undefined,
    sentToInbox: isReady && i % 5 === 0,
    audioUrl: `mock://audio/r_e${i}.m4a`,
    speakers: [
      { id: 's1', label: 'Спикер 1' },
      { id: 's2', label: 'Спикер 2' },
    ],
    segments: isReady
      ? [
          { id: 'g1', speakerId: 's1', start: 3, end: 15, text: 'Короткая заметка по теме встречи.' },
          { id: 'g2', speakerId: 's2', start: 16, end: 30, text: 'Договорились о следующих шагах.' },
        ]
      : [],
    summary: isReady
      ? { theme: `Обсуждение: ${title.toLowerCase()}.`, keywords: ['встреча'], nextSteps: ['Зафиксировать договорённости'] }
      : undefined,
  };
});

/** In-memory «база» прототипа. Мутируется мок-API (rename/delete/send). ~30 записей. */
export const mockRecordings: RecordingDetail[] = [
  lectureDetail,
  weeklyMeeting,
  presentation,
  wideShort,
  failedNote,
  ...extraRecordings,
];
