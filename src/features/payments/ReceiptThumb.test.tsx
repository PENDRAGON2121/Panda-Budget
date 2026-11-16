import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { db } from '../../db/db';
import { addPayment } from '../../db/repos';
import { ReceiptThumb } from './ReceiptThumb';

afterEach(() => vi.unstubAllGlobals());

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

test('creates an objectURL for the receipt and revokes it on unmount', async () => {
  const create = vi.fn(() => 'blob:fake-1');
  const revoke = vi.fn();
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = create;
      static revokeObjectURL = revoke;
    },
  );
  const pay = await addPayment(
    { expenseId: 'e1', amount: 1000, date: Date.now() },
    { blob: new Blob(['x'], { type: 'image/jpeg' }), mime: 'image/jpeg' },
  );
  const { unmount } = render(<ReceiptThumb receiptId={pay.receiptId!} />);
  const img = await screen.findByRole('img', { name: /recibo/i });
  expect(img).toHaveAttribute('src', 'blob:fake-1');
  expect(create).toHaveBeenCalledTimes(1);
  expect(revoke).not.toHaveBeenCalled();
  unmount();
  expect(revoke).toHaveBeenCalledWith('blob:fake-1');
});
