-- Disable automatic administrator promotion.
--
-- Administrator access must be granted explicitly by a trusted database
-- operator after the user has been created through the authentication provider.

DROP TRIGGER IF EXISTS grant_first_user_admin_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.grant_first_user_admin();
