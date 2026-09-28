# Avana Artha Tax Consultant SIA

Static frontend on GitHub Pages with Supabase authentication and database access.

## One-time setup

1. In the Supabase SQL Editor, run `backend/supabase-auth-rls.sql`. This blocks anonymous access to the accounting tables and permits authenticated users.
2. In Supabase Authentication, create the staff user accounts. The website intentionally has no public sign-up form.
3. In Supabase Authentication URL Configuration, set the Site URL and an allowed redirect URL to `https://nando-cyber707.github.io/Fernando-Edo-Savero/`.
4. In the GitHub repository settings, open Pages and set the build/deployment source to GitHub Actions.

The workflow publishes the `frontend` directory after each push to `main`. The site URL is `https://nando-cyber707.github.io/Fernando-Edo-Savero/`.