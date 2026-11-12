import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TabBar } from './TabBar';

test('renders the four persistent tabs', () => {
  render(
    <MemoryRouter>
      <TabBar />
    </MemoryRouter>,
  );
  for (const label of ['Inicio', 'Proyectos', 'Calendario', 'Perfil'])
    expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
});

test('marks only the current route tab as active', () => {
  render(
    <MemoryRouter initialEntries={['/proyectos']}>
      <TabBar />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: /proyectos/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: /inicio/i })).not.toHaveAttribute('aria-current');
});
