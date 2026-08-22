# Order abuse protection

Order submissions are protected by three server-side controls:

- a honeypot field;
- a minimum form-completion time;
- atomic rate limits keyed by HMAC hashes of the client IP and normalized phone.

Raw IP addresses and phone numbers are not stored in the rate-limit table.

## Optional environment variable

Set `ORDER_RATE_LIMIT_SECRET` to a long random server-only value in production.
Do not prefix it with `VITE_` and never commit it to the repository.

When it is not configured, the server falls back to the existing
`SUPABASE_SERVICE_ROLE_KEY` as the HMAC key. A dedicated secret is preferred
because it can be rotated independently.

## Current limits

- phone: 3 submission attempts per 30 minutes;
- IP: 8 submission attempts per 15 minutes;
- minimum form completion time: 3 seconds;
- maximum form age: 2 hours.

The counters are intentionally consumed before an order is inserted. Failed
product validation therefore still counts as an attempt.

## Privacy

The `order_rate_limits` table contains only keyed HMAC digests, counters, and
expiration timestamps. It has RLS enabled, no policies for public users, and no
grants for `anon` or `authenticated`.

The `consume_order_rate_limit` function is executable only by
`service_role`.
