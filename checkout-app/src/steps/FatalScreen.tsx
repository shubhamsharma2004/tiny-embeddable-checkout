import { AlertIcon } from '../icons';

interface Props {
  message: string;
}

export function FatalScreen({ message }: Props) {
  return (
    <div className="centered-state" role="alert">
      <div className="fatal-icon">
        <AlertIcon size={22} />
      </div>
      <h1 className="centered-state__title">Something went wrong</h1>
      <p className="centered-state__subtitle">{message}</p>
    </div>
  );
}
