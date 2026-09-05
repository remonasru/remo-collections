CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  sub_category text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  mrp numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  sizes text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  fabric text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}',
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can write a review" ON public.reviews FOR INSERT WITH CHECK (
  length(name) between 1 and 60 and rating between 1 and 5 and length(text) <= 1000
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer jsonb NOT NULL,
  items jsonb NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT WITH CHECK (true);

INSERT INTO public.products (title, category, sub_category, price, mrp, description, sizes, colors, fabric, in_stock) VALUES
('Classic Cotton Formal Shirt','Men','Shirts (Formal)',899,1499,'Premium breathable cotton formal shirt with a tailored fit. Perfect for office wear and occasions. Machine washable, colour-fast fabric.','{S,M,L,XL,XXL}','{White,Blue}','Cotton',true),
('Slim Fit Denim Jeans','Men','Pants / Trousers',1199,1999,'Stretchable slim-fit denim with reinforced stitching and five-pocket styling. All-day comfort with a sharp silhouette.','{S,M,L,XL,XXL}','{Blue,Black}','Denim',true),
('Rose Pink Designer Kurti','Women','Tops / Tunics',999,1799,'Soft rayon kurti with delicate thread work and a flattering A-line cut. Light, airy and made for everyday elegance.','{S,M,L,XL,XXL}','{Pink}','Rayon',true),
('Floral Printed Maxi Dress','Women','Western Dresses',1349,2299,'Flowy georgette maxi dress with an all-over floral print, elasticated waist and full-length flare.','{S,M,L,"Free Size"}','{Yellow,Green}','Polyester',true),
('Kids Cotton T-Shirt Combo','Kids','Boys T-Shirts',649,1099,'Pack of soft skin-friendly cotton t-shirts in bright colours. Durable stitching that survives playtime and washes.','{2-3Y,4-5Y,6-7Y}','{Red,Blue,Yellow}','Cotton',true),
('Kids Denim Dungaree Set','Kids','Girls Dresses / Frocks',899,1599,'Adorable denim dungaree with adjustable straps and a matching inner tee. Comfortable fit for active kids.','{4-5Y,6-7Y,8-9Y}','{Blue}','Denim',true);
