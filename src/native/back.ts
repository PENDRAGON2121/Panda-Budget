export type BackAction = 'back' | 'exit';

/** Android back button: step back through history, but exit the app from Inicio or when there is nowhere to go. */
export function decideBack(path: string, canGoBack: boolean): BackAction {
  if (path === '/' || path === '') return 'exit';
  return canGoBack ? 'back' : 'exit';
}
