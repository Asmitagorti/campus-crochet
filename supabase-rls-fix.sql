-- Campus Crochet — allow public read + admin writes with anon key.
-- Run this in Supabase Dashboard → SQL Editor. Reads already work;
-- writes currently fail with "new row violates row-level security policy".
-- These policies fix admin add/edit/delete + order status updates.

-- 1. PRODUCTS: public read, open write (lock down later with auth)
DROP POLICY IF EXISTS "public read products" ON public.products;
CREATE POLICY "public read products" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "open insert products" ON public.products;
CREATE POLICY "open insert products" ON public.products
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "open update products" ON public.products;
CREATE POLICY "open update products" ON public.products
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open delete products" ON public.products;
CREATE POLICY "open delete products" ON public.products
  FOR DELETE USING (true);

-- 2. PRODUCT IMAGES
DROP POLICY IF EXISTS "public read product_images" ON public.product_images;
CREATE POLICY "public read product_images" ON public.product_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "open all product_images" ON public.product_images;
CREATE POLICY "open all product_images" ON public.product_images
  FOR ALL USING (true) WITH CHECK (true);

-- 3. PRODUCT COLORS
DROP POLICY IF EXISTS "public read product_colors" ON public.product_colors;
CREATE POLICY "public read product_colors" ON public.product_colors
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "open all product_colors" ON public.product_colors;
CREATE POLICY "open all product_colors" ON public.product_colors
  FOR ALL USING (true) WITH CHECK (true);

-- 4. ORDERS: public read + status updates from admin panel
DROP POLICY IF EXISTS "public read orders" ON public.orders;
CREATE POLICY "public read orders" ON public.orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "open update orders" ON public.orders;
CREATE POLICY "open update orders" ON public.orders
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open insert orders" ON public.orders;
CREATE POLICY "open insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- 5. ORDER ITEMS
DROP POLICY IF EXISTS "public read order_items" ON public.order_items;
CREATE POLICY "public read order_items" ON public.order_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "open all order_items" ON public.order_items;
CREATE POLICY "open all order_items" ON public.order_items
  FOR ALL USING (true) WITH CHECK (true);

-- 6. USERS: public read (for admin user count)
DROP POLICY IF EXISTS "public read users" ON public.users;
CREATE POLICY "public read users" ON public.users
  FOR SELECT USING (true);
