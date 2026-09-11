const logEl = document.getElementById('log') as HTMLDivElement;
const buyBtn = document.getElementById('buy-btn') as HTMLButtonElement;
const clearLogBtn = document.getElementById('clear-log-btn') as HTMLButtonElement;

type LogKind = 'onSuccess' | 'onClose' | 'onError' | 'info';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTimestamp(date: Date): string {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const hours = date.getHours() % 12 || 12;
  return `${day} ${month} · ${hours}:${minutes}:${seconds} ${ampm}`;
}

function appendLog(kind: LogKind, payload: unknown): void {
  const entry = document.createElement('div');
  entry.className = `log-entry log-entry--${kind}`;
  entry.innerHTML = `
    <div class="log-entry__head">
      <span class="log-entry__badge">${kind}</span>
      <span class="log-entry__time">${formatTimestamp(new Date())}</span>
    </div>
    <pre class="log-entry__payload"></pre>
  `;
  const pre = entry.querySelector('pre') as HTMLPreElement;
  pre.textContent = JSON.stringify(payload, null, 2);
  logEl.prepend(entry);
  logEl.scrollTop = 0;
}

function openCheckout(): void {
  window.DodoCheckout.open({
    productId: buyBtn.dataset.productId ?? 'prod_123',
    onSuccess: (result) => appendLog('onSuccess', result),
    onClose: (result) => appendLog('onClose', result),
    onError: (error) => appendLog('onError', error),
  });
}

buyBtn.addEventListener('click', () => {
  appendLog('info', { message: 'Checkout opened', productId: buyBtn.dataset.productId });
  openCheckout();
});

clearLogBtn.addEventListener('click', () => {
  logEl.innerHTML = '';
});
