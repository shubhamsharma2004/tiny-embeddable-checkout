/**
 * postMessage contract — checkout-app side. Mirrors shared/contract.ts and
 * sdk/src/index.ts. Kept as a plain, self-contained file (not a live import
 * across origins) because this app deploys independently of the SDK.
 */

const DODO_MESSAGE_SOURCE = 'dodo-checkout' as const;
const DODO_MESSAGE_VERSION = 1 as const;

export type ParentToChildType = 'init';
export type ChildToParentType =
  | 'ready'
  | 'success'
  | 'payment_error'
  | 'fatal_error'
  | 'closed';

export interface DodoMessage<TType extends string = string, TPayload = unknown> {
  source: typeof DODO_MESSAGE_SOURCE;
  version: typeof DODO_MESSAGE_VERSION;
  type: TType;
  payload: TPayload;
}

export interface InitPayload {
  sessionId: string;
  productId: string;
}

export interface SuccessPayload {
  sessionId: string;
  productId: string;
}

export type PaymentErrorCode = 'card_declined' | 'payment_failed';

export interface PaymentErrorPayload {
  sessionId: string;
  code: PaymentErrorCode;
  message: string;
}

export interface FatalErrorPayload {
  sessionId: string;
  code: string;
  message: string;
}

export interface ClosedPayload {
  sessionId: string;
}

export function createMessage<TType extends string, TPayload>(
  type: TType,
  payload: TPayload
): DodoMessage<TType, TPayload> {
  return { source: DODO_MESSAGE_SOURCE, version: DODO_MESSAGE_VERSION, type, payload };
}

export function isDodoMessage(data: unknown): data is DodoMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).source === DODO_MESSAGE_SOURCE &&
    (data as Record<string, unknown>).version === DODO_MESSAGE_VERSION &&
    typeof (data as Record<string, unknown>).type === 'string'
  );
}
