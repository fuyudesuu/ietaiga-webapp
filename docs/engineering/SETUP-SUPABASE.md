# Setting up sign-in and the database (owner runbook)

This connects a Cloudflare Workers deployment of Encore to Supabase and Discord login (DECISIONS.md, 2026-11-01). Do it for a **staging** setup first; production repeats it with separate accounts and keys.

Never paste a secret into chat, an issue, a commit or a screenshot. Each secret goes straight from the provider's dashboard into the place named below.

## What you need

- A Supabase account, with multi-factor authentication turned on.
- A Discord account for the developer portal, with MFA on.
- The Cloudflare account that will host the Worker, with MFA on.
- The site address, for example `https://encore-staging.<your-subdomain>.workers.dev`. Below it is `SITE`.

## 1. Supabase project

1. Create a project. Pick the region closest to you (Tokyo or Sydney) and a strong database password, stored in your password manager.
2. Open **Project Settings → API**. Note the **Project URL** (`https://<ref>.supabase.co`) and the **publishable key**. The publishable key is designed to be public. Do not copy the `service_role` or secret key anywhere: the web app does not use it.
3. Open **SQL Editor**. Run the contents of `supabase/migrations/20261101000000_initial_schema.sql` once. With the Supabase CLI, `supabase link` then `supabase db push` does the same.
4. Open **Storage**. Check that the `covers` bucket exists and is **not public**.
5. Open **Advisors → Security Advisor**. It should report no tables without RLS.

## 2. Discord application (login only)

1. Go to <https://discord.com/developers/applications> and choose **New Application** ("Encore staging").
2. Open **OAuth2**. Add the redirect `https://<ref>.supabase.co/auth/v1/callback` and nothing else.
3. Copy the **Client ID**. Reset and copy the **Client Secret**, putting it only into Supabase in the next step.
4. Do not add a bot or extra scopes. Encore asks only for `identify`.

## 3. Supabase Auth settings

1. **Authentication → Sign In / Providers → Discord**: enable it and paste the Client ID and Client Secret.
2. Turn off sign-in methods Encore doesn't use (Email, Phone, anonymous sign-ins), so there is no other way in.
3. **Authentication → URL Configuration**:
   - **Site URL:** `SITE`.
   - **Redirect URLs:** exactly `SITE/auth/callback`. No wildcards.
4. Keep the default rate limits. Session settings: a refresh-token reuse interval of 10 seconds and refresh-token rotation on (the default).

## 4. Cloudflare Worker settings

Under **Workers → your worker → Settings → Variables and Secrets**, add:

| Name                       | Type   | Value                       |
| -------------------------- | ------ | --------------------------- |
| `ENCORE_SITE_URL`          | Text   | `SITE`                      |
| `SUPABASE_URL`             | Text   | `https://<ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Secret | the publishable key         |

The publishable key isn't strictly secret, but storing it as a secret keeps it out of logs and screenshots. With none of the three set, the deployment runs as the demo. A partial or invalid set stops sign-in with an error naming the setting, never its value.

## 5. Check it

1. Open `SITE/sign-in` and choose **Continue with Discord**. Approve and you return to Encore.
2. In Supabase **Authentication → Users** you appear once, and **Table Editor → profiles** has your row.
3. Sign in from a second browser with a different Discord account. Neither account can see the other's data. The database tests (`pnpm test:db`, also in CI) prove this against the policies; repeating them against staging is a launch requirement.

## Turning it off

Remove the three Worker settings: sign-in stops and the site is the demo again. To revoke Discord access entirely, reset the client secret in the Discord portal.
