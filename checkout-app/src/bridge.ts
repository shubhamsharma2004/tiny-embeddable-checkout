import {
  ChildToParentType,
  DodoMessage,
  createMessage,
  isDodoMessage,
} from './contract';

/**
 * The host page tells us its own origin via the `parentOrigin` query param
 * when it constructs our iframe `src`. We validate it's a well-formed origin
 * and then use that *exact* string as postMessage's targetOrigin (never
 * '*'), and require every inbound message to come from that same origin and
 * from `window.parent` specifically. This is what makes the "strict origin
 * validation on both sides" property hold even though this app has no
 * built-in allowlist of hosts — any page can embed it, same as real
 * hosted-checkout products.
 */
function resolveExpectedParentOrigin(): string | null {
  const raw = new URLSearchParams(window.location.search).get('parentOrigin');
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export const EXPECTED_PARENT_ORIGIN = resolveExpectedParentOrigin();

export function postToParent<TPayload>(
  type: ChildToParentType,
  payload: TPayload
): void {
  if (!EXPECTED_PARENT_ORIGIN) return;
  window.parent.postMessage(createMessage(type, payload), EXPECTED_PARENT_ORIGIN);
}

export function onParentMessage(
  handler: (msg: DodoMessage) => void
): () => void {
  function listener(e: MessageEvent): void {
    if (!EXPECTED_PARENT_ORIGIN) return;
    if (e.origin !== EXPECTED_PARENT_ORIGIN) return;
    if (e.source !== window.parent) return;
    if (!isDodoMessage(e.data)) return;
    handler(e.data);
  }
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
