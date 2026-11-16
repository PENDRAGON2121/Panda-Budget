import { beforeEach, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { getUserName } from '../lib/settings';

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

test('first launch shows the welcome screen without the tab bar', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: '¡Bienvenido a Panda Wallet!' })).toBeInTheDocument();
  expect(screen.getByLabelText('¿Cómo te llamás?')).toHaveFocus();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  expect(screen.queryByText('Perfil')).not.toBeInTheDocument();
});

test('empty or whitespace name blocks "Empezar"', async () => {
  const user = userEvent.setup();
  render(<App />);
  const start = await screen.findByRole('button', { name: 'Empezar' });
  expect(start).toBeDisabled();
  await user.type(screen.getByLabelText('¿Cómo te llamás?'), '   ');
  expect(start).toBeDisabled();
  await user.keyboard('{Enter}');
  expect(getUserName()).toBe('');
  expect(screen.getByRole('heading', { name: '¡Bienvenido a Panda Wallet!' })).toBeInTheDocument();
});

test('saving routes into the app and the greeting shows the trimmed name', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(await screen.findByLabelText('¿Cómo te llamás?'), '  Mauri  ');
  await user.click(screen.getByRole('button', { name: 'Empezar' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Mauri' })).toBeInTheDocument();
  expect(screen.getByRole('navigation')).toBeInTheDocument();
  expect(getUserName()).toBe('Mauri');
});

test('Enter submits', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(await screen.findByLabelText('¿Cómo te llamás?'), 'Ana{Enter}');
  expect(await screen.findByRole('heading', { level: 1, name: 'Ana' })).toBeInTheDocument();
});

test('a name longer than 40 chars is capped', async () => {
  const user = userEvent.setup();
  render(<App />);
  const input = await screen.findByLabelText('¿Cómo te llamás?');
  await user.type(input, 'x'.repeat(60));
  expect(input).toHaveValue('x'.repeat(40));
});

test('with a stored name the app opens straight into Inicio', async () => {
  localStorage.setItem('panda-wallet:user-name', 'Luis');
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Luis' })).toBeInTheDocument();
  expect(screen.queryByText('¡Bienvenido a Panda Wallet!')).not.toBeInTheDocument();
});

test('editing the name in Perfil updates the greeting without reload', async () => {
  localStorage.setItem('panda-wallet:user-name', 'Luis');
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('heading', { level: 1, name: 'Luis' });
  await user.click(screen.getByRole('link', { name: /perfil/i }));
  const field = await screen.findByLabelText('Tu nombre');
  await user.clear(field);
  await user.type(field, 'Luisa{Enter}');
  await user.click(screen.getByRole('link', { name: /inicio/i }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Luisa' })).toBeInTheDocument();
});

test('clearing the name in Perfil is rejected and the stored name stays', async () => {
  localStorage.setItem('panda-wallet:user-name', 'Luis');
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('link', { name: /perfil/i }));
  const field = await screen.findByLabelText('Tu nombre');
  await user.clear(field);
  await user.keyboard('{Enter}');
  expect(getUserName()).toBe('Luis');
  expect(field).toHaveValue('Luis');
});
