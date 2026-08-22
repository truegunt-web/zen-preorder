-- Private, server-only counters for order abuse prevention.

CREATE TABLE public.order_rate_limits (
  key_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.order_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.order_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.order_rate_limits TO service_role;

CREATE INDEX order_rate_limits_expires_at_idx
  ON public.order_rate_limits (expires_at);

CREATE OR REPLACE FUNCTION public.consume_order_rate_limit(
  p_key_hash TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF p_key_hash IS NULL OR length(p_key_hash) < 32 THEN
    RAISE EXCEPTION 'invalid rate-limit key';
  END IF;
  IF p_limit < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate-limit configuration';
  END IF;

  INSERT INTO public.order_rate_limits (
    key_hash,
    window_started_at,
    request_count,
    expires_at
  )
  VALUES (
    p_key_hash,
    now(),
    1,
    now() + make_interval(secs => p_window_seconds)
  )
  ON CONFLICT (key_hash) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.order_rate_limits.expires_at <= now() THEN now()
      ELSE public.order_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN public.order_rate_limits.expires_at <= now() THEN 1
      ELSE public.order_rate_limits.request_count + 1
    END,
    expires_at = CASE
      WHEN public.order_rate_limits.expires_at <= now()
        THEN now() + make_interval(secs => p_window_seconds)
      ELSE public.order_rate_limits.expires_at
    END
  RETURNING request_count INTO current_count;

  RETURN current_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_order_rate_limit(TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_order_rate_limit(TEXT, INTEGER, INTEGER)
  TO service_role;
