# Tiny Embeddable Checkout

Three folders:

- `sdk/` — the script a website adds. Plain TypeScript, no dependencies. Calling `DodoCheckout.open(config)` opens the checkout.
- `checkout-app/` — the actual checkout screen. Runs on its own origin, loads inside an iframe.
- `demo-site/` — a fake store with a Buy button, so you can see it work.

No backend. Payments are faked in the browser using test card numbers.

## Running it

```bash
# install
cd sdk && npm install && cd ..
cd checkout-app && npm install && cd ..
cd demo-site && npm install && cd ..

# build the SDK once
cd sdk && npm run build && cd ..

# then run these in two separate terminals
cd checkout-app && npm run dev   # localhost:5194
cd demo-site && npm run dev      # localhost:5193
```

# Test card credentials 

| Card | Result |
| `4242 4242 4242 4242` | succeeds |
| `4000 0000 0000 0002` | declines |
| `4000 0000 0000 0341` | fails once, then works |
