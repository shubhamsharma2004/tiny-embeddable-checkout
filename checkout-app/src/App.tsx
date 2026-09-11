import { useEffect, useRef, useState } from 'react';
import './styles.css';
import { getProduct, formatPrice, Product } from './catalog';
import { EXPECTED_PARENT_ORIGIN, onParentMessage, postToParent } from './bridge';
import { InitPayload, PaymentErrorCode } from './contract';
import { simulatePayment } from './payment/simulate';
import { LockIcon } from './icons';
import { Summary } from './steps/Summary';
import { EmailStep } from './steps/EmailStep';
import { CardStep } from './steps/CardStep';
import { SuccessScreen } from './steps/SuccessScreen';
import { ConnectingScreen } from './steps/ConnectingScreen';
import { FatalScreen } from './steps/FatalScreen';

type Phase = 'connecting' | 'summary' | 'email' | 'card' | 'success' | 'fatal';

const STEPS: { phase: Phase; label: string }[] = [
  { phase: 'summary', label: 'Review' },
  { phase: 'email', label: 'Contact' },
  { phase: 'card', label: 'Payment' },
];

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('connecting');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);
  const [fatalMessage, setFatalMessage] = useState<string>('');
  // Tracks how many times a given card number has been submitted this
  // session, so the "fails once then succeeds" test card can behave
  // correctly on retry without any server round trip.
  const attemptsByCard = useRef<Map<string, number>>(new Map());

  // Handshake with the parent SDK: announce readiness, wait for `init`.
  useEffect(() => {
    if (!EXPECTED_PARENT_ORIGIN) {
      setFatalMessage("This checkout window can't be opened directly.");
      setPhase('fatal');
      return;
    }

    const unsubscribe = onParentMessage((msg) => {
      if (msg.type !== 'init') return;
      const payload = msg.payload as Partial<InitPayload>;
      if (!payload.sessionId || !payload.productId) {
        setFatalMessage('This checkout session is missing required information.');
        setPhase('fatal');
        return;
      }
      const loadedProduct = getProduct(payload.productId);
      setSessionId(payload.sessionId);
      setProduct(loadedProduct);
      setSelectedVariantId(loadedProduct.variants[0].id);
      setPhase('summary');
    });

    postToParent('ready', {});
    return unsubscribe;
  }, []);

  // Esc closes the checkout. Keydown inside an iframe never reaches the
  // parent document, so this must be handled here and relayed via
  // postMessage rather than relying on a listener in the host page.
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape' && sessionId && phase !== 'success') {
        postToParent('closed', { sessionId });
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [sessionId, phase]);

  async function handlePay(cardDigits: string) {
    if (isSubmitting || !sessionId || !product) return;
    setIsSubmitting(true);
    setPaymentError(null);

    const attemptNumber = (attemptsByCard.current.get(cardDigits) ?? 0) + 1;
    attemptsByCard.current.set(cardDigits, attemptNumber);

    const outcome = await simulatePayment(cardDigits, attemptNumber);

    if (outcome.status === 'success') {
      setPhase('success');
      window.setTimeout(() => {
        postToParent('success', { sessionId, productId: product.id });
      }, 1300);
      return;
    }

    setIsSubmitting(false);
    const code: PaymentErrorCode = outcome.status === 'declined' ? 'card_declined' : 'payment_failed';
    setPaymentError({ code, message: outcome.message });
    postToParent('payment_error', { sessionId, code, message: outcome.message });
  }

  if (phase === 'connecting') {
    return (
      <div className="app">
        <div className="app__body">
          <ConnectingScreen />
        </div>
      </div>
    );
  }

  if (phase === 'fatal') {
    return (
      <div className="app">
        <div className="app__body">
          <FatalScreen message={fatalMessage} />
        </div>
      </div>
    );
  }

  if (!product) return null;

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const amountLabel = formatPrice(selectedVariant.priceCents, product.currency);

  if (phase === 'success') {
    return (
      <div className="app">
        <div className="app__body">
          <SuccessScreen amountLabel={amountLabel} />
        </div>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.phase === phase);

  return (
    <div className="app">
      <div className="app__chrome">
        <div className="brand-mark">
          <LockIcon />
          Secure checkout
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div
              key={s.phase}
              className={
                'steps__item' +
                (i < stepIndex ? ' steps__item--done' : i === stepIndex ? ' steps__item--active' : '')
              }
            >
              <span className="steps__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="steps__label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="app__body">
        {phase === 'summary' && (
          <Summary
            product={product}
            selectedVariantId={selectedVariant.id}
            onSelectVariant={setSelectedVariantId}
            onContinue={() => setPhase('email')}
          />
        )}
        {phase === 'email' && (
          <EmailStep
            initialName={fullName}
            initialEmail={email}
            onContinue={(name, value) => {
              setFullName(name);
              setEmail(value);
              setPhase('card');
            }}
            onBack={() => setPhase('summary')}
          />
        )}
        {phase === 'card' && (
          <CardStep
            amountLabel={amountLabel}
            initialName={fullName}
            isSubmitting={isSubmitting}
            error={paymentError}
            onPay={handlePay}
            onBack={() => setPhase('email')}
          />
        )}
      </div>
    </div>
  );
}
