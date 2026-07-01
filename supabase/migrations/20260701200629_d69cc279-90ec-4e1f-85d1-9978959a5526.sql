
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');
CREATE TYPE public.delivery_day AS ENUM ('thursday', 'friday', 'saturday');
CREATE TYPE public.order_status AS ENUM ('new', 'confirmed', 'modified', 'completed', 'cancelled');
CREATE TYPE public.product_category AS ENUM ('fish', 'seafood', 'semifinished_turkey', 'semifinished_fish', 'semifinished_squid', 'semifinished_cottage', 'semifinished_apple', 'other');
CREATE TYPE public.unit_of_measure AS ENUM ('kg', 'g', 'pcs', 'pack');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, phone TEXT, address TEXT,
  notify_on_new_window BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor')); $$;

CREATE POLICY "roles_own_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "roles_admin_select" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.product_category NOT NULL DEFAULT 'other',
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  unit public.unit_of_measure NOT NULL DEFAULT 'kg',
  min_order NUMERIC(10,3) NOT NULL DEFAULT 1 CHECK (min_order > 0),
  step NUMERIC(10,3) NOT NULL DEFAULT 1 CHECK (step > 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_select" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_staff(auth.uid()));
CREATE POLICY "products_staff_manage" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.preorder_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  delivery_days public.delivery_day[] NOT NULL DEFAULT ARRAY['thursday','friday','saturday']::public.delivery_day[],
  delivery_week_start DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (closes_at > opens_at)
);
GRANT SELECT ON public.preorder_windows TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.preorder_windows TO authenticated;
GRANT ALL ON public.preorder_windows TO service_role;
ALTER TABLE public.preorder_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "windows_public_select" ON public.preorder_windows FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_staff(auth.uid()));
CREATE POLICY "windows_staff_manage" ON public.preorder_windows FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER windows_updated_at BEFORE UPDATE ON public.preorder_windows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  window_id UUID REFERENCES public.preorder_windows(id) ON DELETE SET NULL,
  delivery_day public.delivery_day NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  address TEXT NOT NULL,
  comment TEXT,
  status public.order_status NOT NULL DEFAULT 'new',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_view" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "orders_create" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id AND status = 'new') OR public.is_staff(auth.uid()))
  WITH CHECK ((auth.uid() = user_id AND status IN ('new','modified')) OR public.is_staff(auth.uid()));
CREATE POLICY "orders_staff_delete" ON public.orders FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit public.unit_of_measure NOT NULL,
  quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_view" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid())))
);
CREATE POLICY "items_insert" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "items_update" ON public.order_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND ((o.user_id = auth.uid() AND o.status = 'new') OR public.is_staff(auth.uid())))
);
CREATE POLICY "items_delete" ON public.order_items FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND ((o.user_id = auth.uid() AND o.status = 'new') OR public.is_staff(auth.uid())))
);
