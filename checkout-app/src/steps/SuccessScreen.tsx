import { CheckIcon } from '../icons';

interface Props {
  amountLabel: string;
}

export function SuccessScreen({ amountLabel }: Props) {
  return (
    <div className="centered-state" role="status">
      <div className="success-check">
        <CheckIcon />
      </div>
      <h1 className="centered-state__title">Payment successful</h1>
      <p className="centered-state__subtitle">
        You were charged {amountLabel}. A receipt has been sent to your email.
      </p>
    </div>
  );
}
