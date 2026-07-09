
UPDATE auth.users
SET encrypted_password = crypt('01234567', gen_salt('bf')),
    updated_at = now()
WHERE email = 'truegunt@admin.local';
