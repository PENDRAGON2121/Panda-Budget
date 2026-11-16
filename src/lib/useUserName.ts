import { useSyncExternalStore } from 'react';
import { getUserName, subscribeUserName } from './settings';

/** Reactive stored name ('' when unset). */
export function useUserName(): string {
  return useSyncExternalStore(subscribeUserName, getUserName, () => '');
}
