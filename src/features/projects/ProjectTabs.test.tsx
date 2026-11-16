import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState } from 'react';
import { ProjectTabs, type TabId } from './ProjectTabs';

function Harness() {
  const [v, setV] = useState<TabId>('gastos');
  return <ProjectTabs value={v} onChange={setV} panels={{ gastos: <p>lista gastos</p>, movimientos: <p>lista movs</p> }} />;
}

test('switches panels by click and arrow keys under StrictMode', async () => {
  render(
    <StrictMode>
      <Harness />
    </StrictMode>,
  );
  await userEvent.click(screen.getByRole('tab', { name: 'Movimientos' }));
  expect(screen.getByRole('tab', { name: 'Movimientos' })).toHaveAttribute('aria-selected', 'true');
  expect(await screen.findByText('lista movs')).toBeInTheDocument();
  screen.getByRole('tab', { name: 'Movimientos' }).focus();
  await userEvent.keyboard('{ArrowLeft}');
  expect(screen.getByRole('tab', { name: 'Gastos' })).toHaveAttribute('aria-selected', 'true');
  expect(await screen.findByText('lista gastos')).toBeInTheDocument();
});
