/**
 * The postMessage contract shared between the SDK (sdk/) and the checkout
 * app (checkout-app/). These two projects are deployed to different origins
 * and never share a JS bundle at runtime — this file is duplicated by hand
 * (or copy-pasted) into each project's source tree at dev time so both
 * sides stay in sync on the wire format. Treat it as the single source of
 * truth when changing the contract.
 */

export const DODO_MESSAGE_SOURCE = 'dodo-checkout' as const;
export const DODO_MESSAGE_VERSION = 1 as const;

/** Messages sent from the parent (SDK) to the iframe (checkout app). */
export type ParentToChildType = 'init';

/** Messages sent from the iframe (checkout app) to the parent (SDK). */
export type ChildToParentType =
  | 'ready'
  | 'success'
  | 'payment_error'
  | 'fatal_error'
  | 'closed';

export interface DodoMessage<
  TType extends string = string,
  TPayload = unknown
> {
  source: typeof DODO_MESSAGE_SOURCE;
  version: typeof DODO_MESSAGE_VERSION;
  type: TType;
  payload: TPayload;
}

// ---- Parent -> child payloads ----

export interface InitPayload {
  sessionId: string;
  productId: string;
}

// ---- Child -> parent payloads ----

export interface ReadyPayload {
  // intentionally empty
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
  return {
    source: DODO_MESSAGE_SOURCE,
    version: DODO_MESSAGE_VERSION,
    type,
    payload,
  };
}

/** Narrow an arbitrary MessageEvent.data down to a well-formed DodoMessage. */
export function isDodoMessage(data: unknown): data is DodoMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).source === DODO_MESSAGE_SOURCE &&
    (data as Record<string, unknown>).version === DODO_MESSAGE_VERSION &&
    typeof (data as Record<string, unknown>).type === 'string'
  );
}
