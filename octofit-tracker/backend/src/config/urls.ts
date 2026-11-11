export const apiPort = Number(process.env.PORT ?? 8000);

export function apiBaseUrl() {
  return process.env.CODESPACE_NAME
    ? `https://${process.env.CODESPACE_NAME}-${apiPort}.app.github.dev`
    : `http://localhost:${apiPort}`;
}
