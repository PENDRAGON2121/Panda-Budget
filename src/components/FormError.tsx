import { Alert } from '@heroui/react';

/** Inline write error shown inside a dialog (the dialog stays open so the user can retry). */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert status="danger" role="alert">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{message}</Alert.Title>
      </Alert.Content>
    </Alert>
  );
}
