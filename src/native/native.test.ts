import { describe, expect, it, vi } from 'vitest';
import { decideBack } from './back';
import { setupServiceWorker } from './serviceWorker';

describe('decideBack', () => {
  it('exits from Inicio even when history exists', () => {
    expect(decideBack('/', true)).toBe('exit');
    expect(decideBack('/', false)).toBe('exit');
  });
  it('goes back elsewhere when it can', () => {
    expect(decideBack('/proyectos/3', true)).toBe('back');
  });
  it('exits when there is no history to go back to', () => {
    expect(decideBack('/perfil', false)).toBe('exit');
  });
});

describe('setupServiceWorker', () => {
  it('does not register in the native shell', () => {
    const register = vi.fn();
    expect(setupServiceWorker(true, register)).toBe(false);
    expect(register).not.toHaveBeenCalled();
  });
  it('registers on the web', () => {
    const register = vi.fn();
    expect(setupServiceWorker(false, register)).toBe(true);
    expect(register).toHaveBeenCalledOnce();
  });
});
