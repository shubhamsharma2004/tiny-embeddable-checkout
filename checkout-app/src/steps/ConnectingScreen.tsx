export function ConnectingScreen() {
  return (
    <div className="centered-state">
      <span className="spinner spinner--muted" style={{ width: 24, height: 24 }} />
      <p className="centered-state__subtitle">Connecting to checkout&hellip;</p>
    </div>
  );
}
