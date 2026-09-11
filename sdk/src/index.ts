/**
 * Dodo Checkout SDK — plain TypeScript, framework-agnostic, zero runtime deps.
 *
 * Usage (host page):
 *   <script src="https://cdn.example.com/dodo-checkout.js" data-checkout-url="https://checkout.example.com"></script>
 *   <script>
 *     DodoCheckout.open({
 *       productId: 'prod_123',
 *       onSuccess: ({ sessionId }) => {},
 *       onClose: ({ reason }) => {},
 *       onError: ({ code, message }) => {},
 *     });
 *   </script>
 */

const DODO_MESSAGE_SOURCE = 'dodo-checkout' as const;
const DODO_MESSAGE_VERSION = 1 as const;

type ChildToParentType =
  | 'ready'
  | 'success'
  | 'payment_error'
  | 'fatal_error'
  | 'closed';

interface DodoMessage<TType extends string = string, TPayload = unknown> {
  source: typeof DODO_MESSAGE_SOURCE;
  version: typeof DODO_MESSAGE_VERSION;
  type: TType;
  payload: TPayload;
}

interface InitPayload {
  sessionId: string;
  productId: string;
}

interface SuccessPayload {
  sessionId: string;
  productId: string;
}
type PaymentErrorCode = 'card_declined' | 'payment_failed';
interface PaymentErrorPayload {
  sessionId: string;
  code: PaymentErrorCode;
  message: string;
}
interface FatalErrorPayload {
  sessionId: string;
  code: string;
  message: string;
}
function createMessage<TType extends string, TPayload>(
  type: TType,
  payload: TPayload
): DodoMessage<TType, TPayload> {
  return { source: DODO_MESSAGE_SOURCE, version: DODO_MESSAGE_VERSION, type, payload };
}

function isDodoMessage(data: unknown): data is DodoMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).source === DODO_MESSAGE_SOURCE &&
    (data as Record<string, unknown>).version === DODO_MESSAGE_VERSION &&
    typeof (data as Record<string, unknown>).type === 'string'
  );
}

// ---- Public API types ----

export interface DodoSuccessResult {
  sessionId: string;
}

export interface DodoCloseResult {
  reason: 'user_cancelled';
}

export interface DodoErrorResult {
  code: string;
  message: string;
}

export interface DodoCheckoutConfig {
  productId: string;
  onSuccess?: (result: DodoSuccessResult) => void;
  onClose?: (result: DodoCloseResult) => void;
  onError?: (error: DodoErrorResult) => void;
}

// ---- Config: where the checkout app is hosted ----
// Resolved once, at script-load time, from the <script> tag's data-checkout-url
// attribute (document.currentScript is only reliable during synchronous
// evaluation of the script, so we capture it immediately at module scope).
const currentScript = document.currentScript as HTMLScriptElement | null;
const CHECKOUT_URL =
  currentScript?.dataset.checkoutUrl || 'http://localhost:5194';
const CHECKOUT_ORIGIN = new URL(CHECKOUT_URL).origin;

const READY_TIMEOUT_MS = 8000;

// ---- Internal session state ----

interface Session {
  sessionId: string;
  config: DodoCheckoutConfig;
  overlayEl: HTMLDivElement;
  iframeEl: HTMLIFrameElement;
  readyReceived: boolean;
  readyTimeoutId: number;
  torndown: boolean;
}

let activeSession: Session | null = null;

function safeInvoke<T extends (...args: any[]) => void>(
  fn: T | undefined,
  ...args: Parameters<T>
): void {
  if (!fn) return;
  try {
    fn(...args);
  } catch (err) {
    // A throwing consumer callback must never break SDK internal cleanup.
    console.error('[DodoCheckout] callback threw an error:', err);
  }
}

function buildOverlay(): { overlayEl: HTMLDivElement; iframeEl: HTMLIFrameElement } {
  const overlayEl = document.createElement('div');
  overlayEl.setAttribute('role', 'dialog');
  overlayEl.setAttribute('aria-modal', 'true');
  overlayEl.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483647',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'background:rgba(15,17,21,0.55)',
    'backdrop-filter:blur(2px)',
    'animation:dodo-fade-in 120ms ease-out',
  ].join(';');

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes dodo-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dodo-pop-in { from { opacity: 0; transform: scale(0.97) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `;
  overlayEl.appendChild(styleEl);

  const modalEl = document.createElement('div');
  modalEl.style.cssText = [
    'position:relative',
    'width:min(440px, calc(100vw - 32px))',
    'height:min(640px, calc(100vh - 32px))',
    'border-radius:16px',
    'overflow:hidden',
    'box-shadow:0 24px 60px rgba(0,0,0,0.35)',
    'animation:dodo-pop-in 160ms ease-out',
  ].join(';');

  const iframeEl = document.createElement('iframe');
  const src = new URL(CHECKOUT_URL);
  src.searchParams.set('parentOrigin', window.location.origin);
  iframeEl.src = src.toString();
  iframeEl.title = 'Checkout';
  iframeEl.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#fff;';
  iframeEl.setAttribute(
    'allow',
    'payment'
  );

  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close checkout');
  closeBtn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.style.cssText = [
    'position:absolute',
    'top:10px',
    'right:10px',
    'width:32px',
    'height:32px',
    'border-radius:50%',
    'border:0',
    'background:rgba(0,0,0,0.45)',
    'color:#fff',
    'line-height:1',
    'cursor:pointer',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'transition:background 120ms ease',
  ].join(';');
  closeBtn.onmouseenter = () => (closeBtn.style.background = 'rgba(0,0,0,0.65)');
  closeBtn.onmouseleave = () => (closeBtn.style.background = 'rgba(0,0,0,0.45)');
  closeBtn.onclick = () => closeCheckout('user_cancelled');

  modalEl.appendChild(iframeEl);
  modalEl.appendChild(closeBtn);
  overlayEl.appendChild(modalEl);

  // Clicking the backdrop (not the modal itself) dismisses the checkout.
  overlayEl.addEventListener('mousedown', (e) => {
    if (e.target === overlayEl) closeCheckout('user_cancelled');
  });

  return { overlayEl, iframeEl };
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeCheckout('user_cancelled');
}

function handleMessage(e: MessageEvent): void {
  const session = activeSession;
  if (!session || session.torndown) return;
  if (e.origin !== CHECKOUT_ORIGIN) return;
  if (e.source !== session.iframeEl.contentWindow) return;
  if (!isDodoMessage(e.data)) return;

  const msg = e.data as DodoMessage<ChildToParentType>;

  switch (msg.type) {
    case 'ready': {
      session.readyReceived = true;
      window.clearTimeout(session.readyTimeoutId);
      const initMsg = createMessage<'init', InitPayload>('init', {
        sessionId: session.sessionId,
        productId: session.config.productId,
      });
      session.iframeEl.contentWindow?.postMessage(initMsg, CHECKOUT_ORIGIN);
      return;
    }
    case 'success': {
      const payload = msg.payload as SuccessPayload;
      teardown(session);
      safeInvoke(session.config.onSuccess, { sessionId: payload.sessionId });
      return;
    }
    case 'payment_error': {
      const payload = msg.payload as PaymentErrorPayload;
      // Non-terminal: the checkout app keeps itself open so the user can retry.
      safeInvoke(session.config.onError, {
        code: payload.code,
        message: payload.message,
      });
      return;
    }
    case 'fatal_error': {
      const payload = msg.payload as FatalErrorPayload;
      teardown(session);
      safeInvoke(session.config.onError, {
        code: payload.code,
        message: payload.message,
      });
      return;
    }
    case 'closed': {
      closeCheckout('user_cancelled');
      return;
    }
  }
}

/** User-facing dismissal path: always tears down and fires onClose. */
function closeCheckout(reason: 'user_cancelled'): void {
  const session = activeSession;
  if (!session || session.torndown) return;
  teardown(session);
  safeInvoke(session.config.onClose, { reason });
}

/** Removes the overlay/iframe and detaches listeners. Idempotent. */
function teardown(session: Session): void {
  if (session.torndown) return;
  session.torndown = true;
  window.clearTimeout(session.readyTimeoutId);
  window.removeEventListener('message', handleMessage);
  document.removeEventListener('keydown', handleKeydown);
  session.overlayEl.remove();
  if (activeSession === session) activeSession = null;
}

function open(config: DodoCheckoutConfig): void {
  if (!config || typeof config.productId !== 'string' || !config.productId) {
    console.error('[DodoCheckout] open() requires a productId.');
    return;
  }

  if (activeSession) {
    safeInvoke(config.onError, {
      code: 'checkout_already_open',
      message: 'A checkout is already open. Close it before opening another.',
    });
    return;
  }

  const sessionId =
    'crypto' in window && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const { overlayEl, iframeEl } = buildOverlay();

  const session: Session = {
    sessionId,
    config,
    overlayEl,
    iframeEl,
    readyReceived: false,
    readyTimeoutId: 0,
    torndown: false,
  };
  activeSession = session;

  session.readyTimeoutId = window.setTimeout(() => {
    if (session.torndown || session.readyReceived) return;
    teardown(session);
    safeInvoke(config.onError, {
      code: 'iframe_load_failed',
      message: 'The checkout failed to load. Please try again.',
    });
  }, READY_TIMEOUT_MS);

  iframeEl.addEventListener('error', () => {
    if (session.torndown) return;
    teardown(session);
    safeInvoke(config.onError, {
      code: 'iframe_load_failed',
      message: 'The checkout failed to load. Please try again.',
    });
  });

  window.addEventListener('message', handleMessage);
  document.addEventListener('keydown', handleKeydown);
  document.body.appendChild(overlayEl);
}

export { open };
