# Avana Artha Tax Consultant SIA

Static frontend on GitHub Pages with Supabase authentication and database access.
Static assignment demo on GitHub Pages. No login is required; all records are fictional and saved only in each visitor's browser.

## One-time setup
## Demo behavior

- Client, invoice, expense, journal, payment, and PDF features use fictional sample data.
- Changes are stored in local storage for the current browser only; visitors do not share or modify one another's records.
- The real Supabase tables remain protected by `backend/supabase-auth-rls.sql` and are not accessed by the public demo.

The workflow publishes the `frontend` directory after each push to `main`. The site URL is `https://nando-cyber707.github.io/Fernando-Edo-Savero/`.