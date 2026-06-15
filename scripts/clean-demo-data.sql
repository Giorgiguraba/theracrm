-- =====================================================================
-- One-shot cleanup: wipe demo leads/reminders/activities + demo programs,
-- insert the real Mindspace catalog. Paste into Supabase SQL Editor.
-- =====================================================================

-- Step 1: clear demo data
delete from activities    where tenant_id = (select id from tenants where slug = 'mindspace');
delete from reminders     where tenant_id = (select id from tenants where slug = 'mindspace');
delete from email_log     where tenant_id = (select id from tenants where slug = 'mindspace');
delete from leads         where tenant_id = (select id from tenants where slug = 'mindspace');
delete from programs      where tenant_id = (select id from tenants where slug = 'mindspace');

-- Step 2: insert real Mindspace programs
insert into programs (tenant_id, name, type, price, currency, is_active)
select
  (select id from tenants where slug = 'mindspace'),
  v.name,
  v.type::program_type,
  v.price,
  'GEL',
  true
from (values
  ('სტაჟირების პროგრამა ფსიქოლოგებისთვის',          'internship', 4800),
  ('არტთერაპია სასწავლო-თერაპიული ჯგუფი (3 თვე)',    'therapy',     300),
  ('ბავშვთა ფსიქოკორექცია არტთერაპიის მეთოდებით',  'therapy',     300),
  ('ქვიშითთერაპია — 4-დღიანი ტრენინგი',             'course',      250),
  ('ნეიროგრაფიკის სასწავლო კურსი',                  'course',        0),
  ('ინდივიდუალური თერაპია',                         'therapy',     120)
) as v(name, type, price);

-- Step 3: verify — you should see 6 rows
select name, type, price from programs
where tenant_id = (select id from tenants where slug = 'mindspace')
order by price desc;
