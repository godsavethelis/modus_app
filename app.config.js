// GitHub Pages отдаёт прототип из подпапки /modus_app/, поэтому прод-сборке нужен baseUrl.
// В dev он ломает роутинг (expo-router не срезает префикс), поэтому включаем его только
// при экспорте — через PAGES_BASE_URL, который выставляет workflow.
module.exports = ({ config }) => {
  const baseUrl = process.env.PAGES_BASE_URL;

  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};
