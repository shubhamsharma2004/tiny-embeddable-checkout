import { FormEvent, useState } from 'react';
import { isValidEmail } from '../payment/validation';

interface Props {
  initialName: string;
  initialEmail: string;
  onContinue: (name: string, email: string) => void;
  onBack: () => void;
}

interface Touched {
  name?: boolean;
  email?: boolean;
}

export function EmailStep({ initialName, initialEmail, onContinue, onBack }: Props) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState<Touched>({});

  const nameValid = name.trim().length > 1;
  const emailValid = isValidEmail(email);

  function markTouched(field: keyof Touched) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true });
    if (!nameValid || !emailValid) return;
    onContinue(name.trim(), email.trim());
  }

  return (
    <form className="step" onSubmit={handleSubmit} noValidate>
      <h1 className="step-title">Contact information</h1>
      <p className="step-subtitle">We&rsquo;ll send your receipt here.</p>

      <div className="field">
        <label htmlFor="full-name">Full name</label>
        <input
          id="full-name"
          type="text"
          autoComplete="name"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={name}
          aria-invalid={touched.name && !nameValid}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => markTouched('name')}
        />
        {touched.name && !nameValid && (
          <div className="field-error">Enter your full name.</div>
        )}
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          aria-invalid={touched.email && !emailValid}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => markTouched('email')}
        />
        {touched.email && !emailValid && (
          <div className="field-error">Enter a valid email address.</div>
        )}
      </div>

      <div className="actions">
        <button className="primary" type="submit">
          Continue
        </button>
        <button className="link" type="button" onClick={onBack}>
          ← Back
        </button>
      </div>
    </form>
  );
}
