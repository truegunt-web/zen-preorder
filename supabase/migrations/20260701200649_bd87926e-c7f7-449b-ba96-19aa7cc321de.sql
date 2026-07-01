
-- Tighten insert policies (require user_id match or null for guest)
DROP POLICY "orders_create" ON public.orders;
CREATE POLICY "orders_create" ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY "items_insert" ON public.order_items;
CREATE POLICY "items_insert" ON public.order_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.user_id IS NULL OR o.user_id = auth.uid() OR public.is_staff(auth.uid()))
    )
  );

-- Revoke public execute on SECURITY DEFINER helpers (only used server-side / in policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
