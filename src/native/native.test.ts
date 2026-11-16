import { describe, expect, it } from 'vitest';
import { decideBack, OVERLAY_SELECTOR } from './back';

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

describe('OVERLAY_SELECTOR', () => {
  it('matches dialogs, alert dialogs and open menus', () => {
    for (const role of ['dialog', 'alertdialog', 'menu']) {
      document.body.innerHTML = `<div role="${role}"></div>`;
      expect(document.querySelector(OVERLAY_SELECTOR)).not.toBeNull();
    }
    document.body.innerHTML = '<div role="listbox"></div>';
    expect(document.querySelector(OVERLAY_SELECTOR)).toBeNull();
  });
});
