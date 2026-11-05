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

## Automatic deploys

`.github/workflows/deploy-worker.yml` deploys the Worker after CI passes on `main`. You can also start it by hand: open the Actions tab, choose **Deploy Worker**, then **Run workflow**. It skips until these two secrets exist:

1. **Cloudflare API token.** In the Cloudflare dashboard open **My Profile → API Tokens → Create Token** and use the **Edit Cloudflare Workers** template. Limit **Account Resources** to your account and **Zone Resources** to none, or only the zone you will use. Create it and copy the token once.
2. **Account ID.** Shown on the Cloudflare dashboard's **Workers & Pages** overview, in the right-hand column.
3. In GitHub open the repository's **Settings → Secrets and variables → Actions → New repository secret**. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. Run **Deploy Worker** by hand once. The Worker `encore-concert-travel` appears under **Workers & Pages**, at `https://encore-concert-travel.<your-subdomain>.workers.dev`. That address is `SITE` below.

Deploys keep the variables you set in the dashboard (`keep_vars`), and secrets are always kept. To stop deploys, delete the token in Cloudflare; the workflow then fails at the deploy step until the secret is removed or replaced.

## 4. Cloudflare Worker settings

Under **Workers → your worker → Settings → Variables and Secrets**, add:

| Name                       | Type   | Value                       |
| -------------------------- | ------ | --------------------------- |
| `ENCORE_SITE_URL`          | Text   | `SITE`                      |
| `SUPABASE_URL`             | Text   | `https://<ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Secret | the publishable key         |

The publishable key isn't strictly secret, but storing it as a secret keeps it out of logs and screenshots. With none of the three set, the deployment runs as the demo. A partial or invalid set stops sign-in with an error naming the setting, never its value.

Then, in the Cloudflare dashboard under **Security → WAF → Rate limiting rules**, add a rule for paths starting with `/auth/`, for example 20 requests per minute per IP, with the action **Block** for 1 minute. This stops scripted sign-in floods using up Supabase's limits for everyone.

## 5. Check it

1. Open `SITE/sign-in` and choose **Continue with Discord**. On Discord's consent screen, note which permissions are listed (name, and probably email). Approve and you return to Encore.
2. In Supabase **Authentication → Users** you appear once, and **Table Editor → profiles** has your row.
3. Sign in from a second browser with a different Discord account. Neither account can see the other's data. The database tests (`pnpm test:db`, also in CI) prove this against the policies; repeating them against staging is a launch requirement.

## Turning it off

Remove the three Worker settings: sign-in stops and the site is the demo again. To revoke Discord access entirely, reset the client secret in the Discord portal.
