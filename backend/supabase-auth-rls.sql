-- Run once in Supabase SQL Editor before publishing the frontend.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.coa TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients, public.invoices, public.expenses, public.journal_entries, public.journal_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.clients_id_seq, public.invoices_id_seq, public.expenses_id_seq, public.journal_entries_id_seq, public.journal_items_id_seq TO authenticated;

ALTER TABLE public.coa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sia_block_anon ON public.coa;
CREATE POLICY sia_block_anon ON public.coa AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS sia_authenticated_read ON public.coa;
CREATE POLICY sia_authenticated_read ON public.coa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS sia_block_anon ON public.clients;
CREATE POLICY sia_block_anon ON public.clients AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS sia_authenticated_manage ON public.clients;
CREATE POLICY sia_authenticated_manage ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS sia_block_anon ON public.invoices;
CREATE POLICY sia_block_anon ON public.invoices AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS sia_authenticated_manage ON public.invoices;
CREATE POLICY sia_authenticated_manage ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS sia_block_anon ON public.expenses;
CREATE POLICY sia_block_anon ON public.expenses AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS sia_authenticated_manage ON public.expenses;
CREATE POLICY sia_authenticated_manage ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS sia_block_anon ON public.journal_entries;
CREATE POLICY sia_block_anon ON public.journal_entries AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS sia_authenticated_manage ON public.journal_entries;
CREATE POLICY sia_authenticated_manage ON public.journal_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS sia_block_anon ON public.journal_items;
CREATE POLICY sia_block_anon ON public.journal_items AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS sia_authenticated_manage ON public.journal_items;
CREATE POLICY sia_authenticated_manage ON public.journal_items FOR ALL TO authenticated USING (true) WITH CHECK (true);