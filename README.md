# Avana Artha Tax Consultant SIA

Static frontend on GitHub Pages with Supabase authentication and database access.
Static assignment demo on GitHub Pages. No login is required; all records are fictional and saved only in each visitor's browser.
Public Supabase-backed web app on GitHub Pages. No login is required; visitors share the same database.

## One-time setup
## Demo behavior
## Public access

- Any visitor can read, create, or update clients, invoices, expenses, and journals. Deletion is not granted to anonymous visitors.
- The database is shared by everyone. Do not use this configuration for confidential or production accounting records.
- Run `backend/supabase-auth-rls.sql` in the Supabase SQL Editor to apply these public permissions.

The workflow publishes the `frontend` directory after each push to `main`. The site URL is `https://nando-cyber707.github.io/Fernando-Edo-Savero/`.