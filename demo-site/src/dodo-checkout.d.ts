/**
 * Ambient type declaration for the DodoCheckout global exposed by
 * /dodo-checkout.js (loaded via a plain <script> tag, not an import — see
 * index.html). Mirrors the public API in sdk/src/index.ts.
 */

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

declare global {
  interface Window {
    DodoCheckout: {
      open: (config: DodoCheckoutConfig) => void;
    };
  }
}
