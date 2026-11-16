import { describe, expect, it } from 'vitest';
import { decideBack } from './back';

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
