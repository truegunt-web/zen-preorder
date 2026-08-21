# Administrator access

Administrator accounts must never be created with credentials stored in source
control or database migrations.

## Before production launch

1. In Supabase Authentication settings, disable public email sign-ups unless the
   product explicitly needs customer accounts.
2. Rotate any password that has ever appeared in repository history.
3. Revoke existing sessions for the affected account.
4. Review Authentication logs, `auth.users`, and `public.user_roles` for
   unexpected accounts or role assignments.

## Grant staff access

Create or invite the user through the Supabase Authentication dashboard. After
the email address and user identity have been verified, run the following in a
trusted SQL session, replacing the placeholder with the verified user UUID:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('VERIFIED_USER_UUID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Use `editor` instead of `admin` when full administrative access is not
required. Never grant a role based only on an unverified email address.

## Remove staff access

```sql
DELETE FROM public.user_roles
WHERE user_id = 'VERIFIED_USER_UUID'
  AND role IN ('admin', 'editor');
```

After removing access, revoke the user's active authentication sessions in the
Supabase dashboard.
