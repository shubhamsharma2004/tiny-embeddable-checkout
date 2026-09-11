import { FormEvent, useState } from 'react';
import {
  formatCardNumber,
  normalizeCardNumber,
  isValidCardNumber,
  formatExpiry,
  isValidExpiry,
  normalizeCvc,
  isValidCvc,
} from '../payment/validation';
import { AlertIcon, RefreshIcon } from '../icons';
import type { PaymentError } from '../App';

interface Props {
  amountLabel: string;
  initialName: string;
  isSubmitting: boolean;
  error: PaymentError | null;
  onPay: (cardDigits: string) => void;
  onBack: () => void;
}

interface Touched {
  name?: boolean;
  cardNumber?: boolean;
  expiry?: boolean;
  cvc?: boolean;
}

// A decline and a transient processing failure are not the same problem for
// the user, so they don't get the same banner: a decline points at the card
// ("try something else"), a transient failure points at nothing charging
// ("your card is fine, just try again").
function errorCopy(error: PaymentError): { title: string; body: string; tone: 'decline' | 'retry' } {
  if (error.code === 'card_declined') {
    return {
      title: 'This card was declined.',
      body: 'Double-check the number, or try a different card.',
      tone: 'decline',
    };
  }
  return {
    title: "Payment didn't go through.",
    body: 'Nothing was charged — please try again.',
    tone: 'retry',
  };
}

export function CardStep({ amountLabel, initialName, isSubmitting, error, onPay, onBack }: Props) {
  const [name, setName] = useState(initialName);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [touched, setTouched] = useState<Touched>({});

  const cardDigits = normalizeCardNumber(cardNumber);
  const cardValid = isValidCardNumber(cardDigits);
  const expiryValid = isValidExpiry(expiry);
  const cvcDigits = normalizeCvc(cvc);
  const cvcValid = isValidCvc(cvcDigits);
  const nameValid = name.trim().length > 1;
  const formValid = cardValid && expiryValid && cvcValid && nameValid;

  function markTouched(field: keyof Touched) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return; // idempotent guard against double submit
    setTouched({ name: true, cardNumber: true, expiry: true, cvc: true });
    if (!formValid) return;
    onPay(cardDigits);
  }

  const copy = error ? errorCopy(error) : null;

  return (
    <form className="step" onSubmit={handleSubmit} noValidate>
      <h1 className="step-title">Payment details</h1>
      <p className="step-subtitle">Enter your card information to complete the purchase.</p>

      {copy && (
        <div className={`banner banner--${copy.tone}`} role="alert">
          <span className="banner__icon">
            {copy.tone === 'retry' ? <RefreshIcon /> : <AlertIcon />}
          </span>
          <span>
            <p className="banner__title">{copy.title}</p>
            <p className="banner__body">{copy.body}</p>
          </span>
        </div>
      )}

      <div className="field">
        <label htmlFor="cc-name">Name on card</label>
        <input
          id="cc-name"
          type="text"
          autoComplete="cc-name"
          value={name}
          disabled={isSubmitting}
          aria-invalid={touched.name && !nameValid}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => markTouched('name')}
        />
        {touched.name && !nameValid && (
          <div className="field-error">Enter the name on the card.</div>
        )}
      </div>

      <div className="field">
        <label htmlFor="cc-number">Card number</label>
        <input
          id="cc-number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={formatCardNumber(cardNumber)}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          disabled={isSubmitting}
          aria-invalid={touched.cardNumber && !cardValid}
          onChange={(e) => setCardNumber(e.target.value)}
          onBlur={() => markTouched('cardNumber')}
        />
        {touched.cardNumber && !cardValid && (
          <div className="field-error">Enter a valid 16-digit card number.</div>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="cc-exp">Expiry</label>
          <input
            id="cc-exp"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            disabled={isSubmitting}
            aria-invalid={touched.expiry && !expiryValid}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            onBlur={() => markTouched('expiry')}
          />
          {touched.expiry && !expiryValid && (
            <div className="field-error">Invalid or expired date.</div>
          )}
        </div>
        <div className="field">
          <label htmlFor="cc-cvc">CVC</label>
          <input
            id="cc-cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={cvc}
            disabled={isSubmitting}
            aria-invalid={touched.cvc && !cvcValid}
            onChange={(e) => setCvc(normalizeCvc(e.target.value))}
            onBlur={() => markTouched('cvc')}
          />
          {touched.cvc && !cvcValid && <div className="field-error">Invalid CVC.</div>}
        </div>
      </div>

      <div className="test-hint">
        <span className="test-hint__tag">Test mode</span>
        <span>
          <code>4242 4242 4242 4242</code> succeeds &middot; <code>4000 0000 0000 0002</code>{' '}
          declines &middot; <code>4000 0000 0000 0341</code> fails once, then succeeds
        </span>
      </div>

      <div className="actions">
        <button className="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting && <span className="spinner" aria-hidden="true" />}
          {isSubmitting ? 'Processing…' : `Pay ${amountLabel}`}
        </button>
        <button className="link" type="button" onClick={onBack} disabled={isSubmitting}>
          ← Back
        </button>
      </div>
    </form>
  );
}
