# Open Your Eyes — Agent Playbook

> **What is this?** Instructions for an AI agent (Claude Code, Cursor, etc.) to interactively walk a user through collecting every credential needed to auto-deploy websites to custom domains. After this playbook completes, the agent can go from "build me X" to a live site at `yourdomain.com` with zero manual steps.

---

## 0. How to Use This Playbook

**If you're a human reading this:** You don't need to follow these steps yourself. Start a conversation with an AI agent (like Claude Code) in this directory, and say:

> "Run the playbook — set me up so you can deploy sites for me."

The agent will walk you through everything conversationally.

**If you're an AI agent reading this:** Follow the sections below in order. Each section has a CHECK → GUIDE → COLLECT → VALIDATE → STORE flow. Be conversational and patient. Explain jargon on first use. If a validation fails, diagnose and help the user fix it before moving on.

### Ground Rules for the Agent
- **Never store keys in project directories or git** — only in `~/.open-your-eyes/secrets.env`
- **Validate every key before storing it** — make the actual API call shown in the VALIDATE step
- **Don't skip ahead** — complete each validation gate before moving to the next tier
- **Be honest about what each key allows** — tell the user what permissions they're granting
- **If the user wants to stop after Tier 1, that's fine** — each tier is independently useful

---

## 1. Intro & Assessment

Start the conversation like this:

> I'm going to set you up so I can deploy websites to your own domain — fully automated, from code to live site. We'll collect API keys from a few services. Everything stays on your machine, nothing leaves.
>
> This takes about 15-20 minutes. We'll go in tiers:
> - **Tier 1** (~10 min): Hosting + DNS + Domain — after this, I can deploy sites to your domain
> - **Tier 2** (~5 min): Database + Payments — after this, I can build full-stack apps
> - **Tier 3** (~5 min): Email + Monitoring — production polish
>
> You can stop after any tier. Ready?

Then ask:

> Before we start, let me check what you already have:
> 1. Do you already have a **Vercel** account?
> 2. Do you have a **Cloudflare** account?
> 3. Do you own any **domains**? If so, where are they registered?
> 4. Do you have a **Supabase** account?
> 5. Do you have a **Stripe** account?

Based on responses, skip the "Create Account" steps for services they already have.

### Storage Setup

Before collecting any keys, set up the credential store:

```bash
mkdir -p ~/.open-your-eyes
touch ~/.open-your-eyes/secrets.env
chmod 600 ~/.open-your-eyes/secrets.env

# Add to global gitignore if not already there
echo ".open-your-eyes/" >> ~/.gitignore_global 2>/dev/null
git config --global core.excludesFile ~/.gitignore_global
```

---

# TIER 1: Minimum Viable Deploy

*After this tier, the agent can deploy static sites and SPAs to a custom domain.*

---

## 2. Hosting — Vercel

### Why Vercel?
Vercel has the best API for automated deployments. Free tier handles most projects. Supports static sites, React, Next.js, and more. One API token lets the agent create projects, deploy code, and manage environment variables — all programmatically.

### Check
> Do you already have a Vercel API token? (Not your login password — a separate token for API access.)

→ **YES**: Skip to [Collect Key](#vercel-collect)
→ **NO**: Continue below

### Create Account
> Let's set up Vercel. Here's what to do:
>
> 1. **Go to** [vercel.com/signup](https://vercel.com/signup)
> 2. **Sign up** with GitHub (recommended — it'll make deployments smoother later)
> 3. You'll land on the Vercel dashboard. No need to create a project yet — I'll do that for you.

### Create API Token
> Now let's create an API token so I can deploy on your behalf:
>
> 1. **Go to** [vercel.com/account/tokens](https://vercel.com/account/tokens)
> 2. Click **"Create Token"**
> 3. **Token name**: `open-your-eyes` (or whatever you like)
> 4. **Scope**: Select "Full Account" (I need this to create projects and deploy)
> 5. **Expiration**: "No expiration" (or set a reminder to rotate it)
> 6. Click **"Create"**
> 7. **Copy the token** — it only shows once!

### Collect Key {#vercel-collect}
> Please paste your Vercel API token. It starts with something like `prj_` or is a long alphanumeric string.

### Validate
Run this to confirm the token works:

```bash
VERCEL_TOKEN="<pasted token>"
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'user' in data:
    print(f'✓ Connected to Vercel account: {data[\"user\"][\"username\"]} ({data[\"user\"][\"email\"]})')
else:
    print(f'✗ Token did not work. Response: {json.dumps(data, indent=2)}')
    sys.exit(1)
"
```

**If validation fails**, common issues:
- Token was copied with extra whitespace → trim and retry
- Token expired → create a new one at [vercel.com/account/tokens](https://vercel.com/account/tokens)
- Wrong token type → make sure it's an API token, not an OAuth token

### Store
Append to `~/.open-your-eyes/secrets.env`:
```bash
echo "VERCEL_TOKEN=$VERCEL_TOKEN" >> ~/.open-your-eyes/secrets.env
```

> ✓ Vercel is set up. I can now create projects and deploy code to Vercel on your behalf.

---

## 3. DNS — Cloudflare

### Why Cloudflare?
Cloudflare provides free DNS with an excellent API. The agent can programmatically create DNS records to point your domain at your Vercel deployment. Cloudflare also provides free SSL, DDoS protection, and CDN — all automatic.

### Check
> Do you already have a Cloudflare account with a domain added to it?

→ **YES with API token**: Skip to [Collect Key](#cloudflare-collect)
→ **YES but no token**: Skip to [Create API Token](#cloudflare-token)
→ **NO**: Continue below

### Create Account
> Let's set up Cloudflare for DNS:
>
> 1. **Go to** [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
> 2. **Sign up** with your email
> 3. You'll land on the Cloudflare dashboard

### Add Domain to Cloudflare
> Now we need to add your domain to Cloudflare so I can manage its DNS:
>
> 1. Click **"Add a site"** in the dashboard
> 2. **Enter your domain** (e.g., `yourdomain.com`)
> 3. Select the **Free plan** (it's more than enough)
> 4. Cloudflare will scan your existing DNS records — review them and click **Continue**
> 5. Cloudflare will give you **two nameservers** (something like `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com`)
> 6. **Go to your domain registrar** (where you bought the domain) and **change the nameservers** to the Cloudflare ones
>    - This is usually under "Domain Settings" → "Nameservers" or "DNS"
>    - Replace the existing nameservers with the two Cloudflare gave you
> 7. **Wait for propagation** — this can take a few minutes to 24 hours, but usually under an hour
>
> ⚠️ **Changing nameservers means Cloudflare will handle ALL DNS for this domain.** Existing DNS records were imported in step 4, but double-check nothing is missing.

### Create API Token {#cloudflare-token}
> Now let's create a scoped API token:
>
> 1. **Go to** [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
> 2. Click **"Create Token"**
> 3. Use the **"Edit zone DNS"** template (click "Use template" next to it)
> 4. Under **Zone Resources**, select:
>    - "Include" → "Specific zone" → select your domain
>    - Or "Include" → "All zones" (if you want me to manage DNS for any domain on your account)
> 5. Click **"Continue to summary"** → **"Create Token"**
> 6. **Copy the token** — it only shows once!

### Collect Key {#cloudflare-collect}
> Please paste your Cloudflare API token.

Also need:
> What's the domain you added to Cloudflare? (e.g., `yourdomain.com`)

### Validate
Run this to confirm the token works:

```bash
CF_API_TOKEN="<pasted token>"
CF_DOMAIN="<domain>"

# Verify token
curl -s -H "Authorization: Bearer $CF_API_TOKEN" https://api.cloudflare.com/client/v4/user/tokens/verify | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    print('✓ Cloudflare token is valid')
else:
    print(f'✗ Token verification failed: {json.dumps(data, indent=2)}')
    sys.exit(1)
"

# Get zone ID for the domain
CF_ZONE_ID=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=$CF_DOMAIN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['result']:
    zone = data['result'][0]
    print(zone['id'])
else:
    print('NOT_FOUND')
    sys.exit(1)
")

if [ "$CF_ZONE_ID" = "NOT_FOUND" ]; then
    echo "✗ Domain '$CF_DOMAIN' not found on your Cloudflare account."
    echo "  Make sure you've added the domain and nameserver changes have propagated."
else
    echo "✓ Found zone for $CF_DOMAIN (Zone ID: $CF_ZONE_ID)"
fi
```

**If validation fails**, common issues:
- Domain not added to Cloudflare yet → go back to "Add Domain" step
- Nameservers haven't propagated → wait and retry (check at [dnschecker.org](https://dnschecker.org))
- Token doesn't have DNS edit permissions → create a new token with the "Edit zone DNS" template

### Store
```bash
echo "CLOUDFLARE_API_TOKEN=$CF_API_TOKEN" >> ~/.open-your-eyes/secrets.env
echo "CLOUDFLARE_ZONE_ID=$CF_ZONE_ID" >> ~/.open-your-eyes/secrets.env
echo "CLOUDFLARE_DOMAIN=$CF_DOMAIN" >> ~/.open-your-eyes/secrets.env
```

> ✓ Cloudflare DNS is set up. I can now create and modify DNS records for `$CF_DOMAIN`.

---

## 4. Domain Registration — Porkbun (Optional)

### Why this step is optional
If you already own a domain and it's on Cloudflare, you can skip this. This step is for users who want the agent to be able to **buy new domains** programmatically.

### Why Porkbun?
Cheapest registrar with a clean API. No upsells, transparent pricing, and the API lets the agent search for available domains and register them.

### Check
> Do you want me to be able to purchase new domains for you? If you already have domains you're happy with, we can skip this.

→ **SKIP**: Jump to [Validation Gate 1](#gate-1)
→ **YES**: Continue below

### Create Account
> Let's set up Porkbun:
>
> 1. **Go to** [porkbun.com/account/register](https://porkbun.com/account/register)
> 2. **Sign up** and complete email verification
> 3. **Add a payment method** (required for domain purchases) under Account → Billing

### Enable API Access
> Now enable API access:
>
> 1. **Go to** [porkbun.com/account/api](https://porkbun.com/account/api)
> 2. Click **"Create API Key"**
> 3. You'll get two values:
>    - **API Key** (starts with `pk1_`)
>    - **Secret API Key** (starts with `sk1_`)
> 4. **Copy both** — store them somewhere safe temporarily
>
> ⚠️ **This gives the agent the ability to purchase domains with your payment method.** Domains typically cost $5-15/year. The agent will always ask for confirmation before purchasing.

### Collect Keys
> Please paste your Porkbun API Key (starts with `pk1_`):

> And your Porkbun Secret Key (starts with `sk1_`):

### Validate
```bash
PORKBUN_API_KEY="<pasted key>"
PORKBUN_SECRET_KEY="<pasted secret>"

curl -s -X POST https://api.porkbun.com/api/json/v3/ping \
  -H "Content-Type: application/json" \
  -d "{\"apikey\":\"$PORKBUN_API_KEY\",\"secretapikey\":\"$PORKBUN_SECRET_KEY\"}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('status') == 'SUCCESS':
    print(f'✓ Porkbun API works! Your IP: {data.get(\"yourIp\", \"unknown\")}')
else:
    print(f'✗ Porkbun API failed: {data.get(\"message\", \"Unknown error\")}')
    sys.exit(1)
"
```

**If validation fails**, common issues:
- API access not enabled → go to [porkbun.com/account/api](https://porkbun.com/account/api) and enable it
- Keys copied with extra characters → check for trailing spaces
- No payment method → add one at Account → Billing

### Store
```bash
echo "PORKBUN_API_KEY=$PORKBUN_API_KEY" >> ~/.open-your-eyes/secrets.env
echo "PORKBUN_SECRET_KEY=$PORKBUN_SECRET_KEY" >> ~/.open-your-eyes/secrets.env
```

> ✓ Porkbun is set up. I can now search for and register domains on your behalf (I'll always ask first).

---

## 5. Validation Gate 1: Deploy to Custom Domain {#gate-1}

> Let's prove everything works. I'm going to:
> 1. Create a simple "Hello World" page
> 2. Deploy it to Vercel
> 3. Point your domain at it via Cloudflare
> 4. Confirm it's live at `https://yourdomain.com`
>
> This will take about 2 minutes. Want me to go ahead?

### Steps the Agent Takes

```bash
# Load credentials
source ~/.open-your-eyes/secrets.env

# 1. Create a minimal site
mkdir -p /tmp/oye-test && cat > /tmp/oye-test/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head><title>Open Your Eyes</title></head>
<body>
  <h1>It works!</h1>
  <p>This site was deployed automatically by an AI agent.</p>
  <p>Deployed at: <script>document.write(new Date().toISOString())</script></p>
</body>
</html>
HTMLEOF

# 2. Deploy to Vercel
cd /tmp/oye-test
npx vercel deploy --prod --token=$VERCEL_TOKEN --yes --name=oye-test 2>&1

# 3. Get the Vercel deployment URL and extract the project domain
VERCEL_URL=$(npx vercel ls --token=$VERCEL_TOKEN oye-test 2>/dev/null | grep "Ready" | head -1 | awk '{print $2}')

# 4. Add CNAME record in Cloudflare pointing domain → Vercel
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"CNAME\",
    \"name\": \"@\",
    \"content\": \"cname.vercel-dns.com\",
    \"ttl\": 1,
    \"proxied\": false
  }"

# 5. Add domain to Vercel project
curl -s -X POST "https://api.vercel.com/v10/projects/oye-test/domains" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$CLOUDFLARE_DOMAIN\"}"

# 6. Wait and verify
sleep 30
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$CLOUDFLARE_DOMAIN")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Site is live at https://$CLOUDFLARE_DOMAIN"
else
    echo "⏳ DNS may still be propagating. Status: $HTTP_STATUS. Try again in a few minutes."
fi
```

### Success
> 🎉 **Tier 1 complete!** Your site is live at `https://yourdomain.com`.
>
> From now on, I can deploy any site to your domain. Just say "build me X" and I'll handle everything.
>
> Want to continue to Tier 2 (database + payments) or stop here?

### Clean Up
```bash
# Remove the test deployment
npx vercel rm oye-test --token=$VERCEL_TOKEN --yes 2>/dev/null
# Remove the test CNAME (agent should track the record ID from the creation response)
```

---

# TIER 2: Full-Stack App

*After this tier, the agent can build apps with databases, user auth, and payment processing.*

---

## 6. Database + Auth + Storage — Supabase

### Why Supabase?
One platform for your database (Postgres), user authentication, file storage, edge functions, and realtime subscriptions. The agent gets a full backend from a single API key. Free tier includes 2 projects, 500MB database, 1GB storage.

### Check
> Do you already have a Supabase account?

→ **YES with existing project**: Skip to [Collect Keys](#supabase-collect)
→ **YES but no project**: Skip to [Create Project](#supabase-project)
→ **NO**: Continue below

### Create Account
> Let's set up Supabase:
>
> 1. **Go to** [supabase.com/dashboard](https://supabase.com/dashboard)
> 2. **Sign up** with GitHub (recommended) or email
> 3. You'll land on the Supabase dashboard

### Create Project {#supabase-project}
> Create your first project:
>
> 1. Click **"New Project"**
> 2. **Name**: Whatever you like (e.g., `my-apps`)
> 3. **Database Password**: Generate a strong one — **save this somewhere safe**, you may need it later
> 4. **Region**: Pick the closest to your users
> 5. Click **"Create new project"**
> 6. Wait ~2 minutes for it to provision

### Get Project Keys
> Now let's grab the keys I need:
>
> 1. In your project, go to **Settings** → **API** (in the left sidebar under "Project Settings")
> 2. You'll see:
>    - **Project URL** — something like `https://abcdefg.supabase.co`
>    - **anon/public key** — safe to use in frontend code
>    - **service_role key** — ⚠️ **This is a powerful key** — it bypasses Row Level Security. Only the agent should use this, never expose it in frontend code.
> 3. **Copy all three values**

### Get Management API Token (for creating new projects)
> If you want me to be able to create new Supabase projects for you:
>
> 1. **Go to** [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
> 2. Click **"Generate new token"**
> 3. **Name**: `open-your-eyes`
> 4. **Copy the token**
>
> This is optional — without it, I can still use your existing project but can't create new ones.

### Collect Keys {#supabase-collect}
> Please paste the following:
> 1. **Supabase Project URL** (e.g., `https://abcdefg.supabase.co`):
> 2. **Supabase anon key** (starts with `eyJ...`):
> 3. **Supabase service_role key** (starts with `eyJ...`):
> 4. **Supabase Management API token** (optional):

### Validate
```bash
SUPABASE_URL="<project url>"
SUPABASE_ANON_KEY="<anon key>"
SUPABASE_SERVICE_ROLE_KEY="<service role key>"

# Test the connection by querying the health endpoint
curl -s "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # A successful response returns the schema (even if empty)
    print('✓ Supabase connection works!')
except:
    print('✗ Could not connect to Supabase. Check your URL and anon key.')
    sys.exit(1)
"

# Test service role key by checking if we can access auth admin
curl -s "$SUPABASE_URL/auth/v1/admin/users?per_page=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list) or 'users' in str(data):
    print('✓ Service role key works (admin access confirmed)')
else:
    print('⚠ Service role key may not have full access. Response: ' + json.dumps(data)[:200])
"

# Test management API if provided
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    curl -s https://api.supabase.com/v1/projects \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    print(f'✓ Management API works! Found {len(data)} project(s)')
else:
    print(f'✗ Management API failed: {json.dumps(data)[:200]}')
"
fi
```

### Store
```bash
echo "SUPABASE_URL=$SUPABASE_URL" >> ~/.open-your-eyes/secrets.env
echo "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> ~/.open-your-eyes/secrets.env
echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" >> ~/.open-your-eyes/secrets.env
# Only if provided:
echo "SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN" >> ~/.open-your-eyes/secrets.env
```

> ✓ Supabase is set up. I can now create databases, manage users, handle file storage, and run edge functions.

---

## 7. Payments — Stripe

### Why Stripe?
Industry standard for payments. Excellent API, great docs, and the test mode lets us validate everything without real charges. The agent can create products, set up checkout, and handle subscriptions — all via API.

### Check
> Do you already have a Stripe account?

→ **YES**: Skip to [Get API Keys](#stripe-keys)
→ **NO**: Continue below

### Create Account
> Let's set up Stripe:
>
> 1. **Go to** [dashboard.stripe.com/register](https://dashboard.stripe.com/register)
> 2. **Sign up** with your email
> 3. You **don't need to activate your account** yet — test mode works without verification
> 4. You'll land on the Stripe dashboard

### Get API Keys {#stripe-keys}
> Let's grab your API keys:
>
> 1. **Go to** [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
> 2. Make sure the **"Test mode"** toggle is ON (top right) — we'll start in test mode
> 3. You'll see:
>    - **Publishable key** — starts with `pk_test_` (safe for frontend)
>    - **Secret key** — starts with `sk_test_` (click "Reveal" to see it)
> 4. **Copy both keys**
>
> ⚠️ When you're ready to accept real payments, you'll switch to live keys (`pk_live_`, `sk_live_`). We'll start with test keys to validate everything safely.

### Collect Keys
> Please paste:
> 1. **Stripe Publishable Key** (starts with `pk_test_`):
> 2. **Stripe Secret Key** (starts with `sk_test_`):

### Validate
```bash
STRIPE_PUBLISHABLE_KEY="<pk_test_...>"
STRIPE_SECRET_KEY="<sk_test_...>"

curl -s https://api.stripe.com/v1/balance \
  -u "$STRIPE_SECRET_KEY:" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'available' in data:
    print('✓ Stripe connection works! (Test mode)')
    for bal in data['available']:
        print(f'  Balance: {bal[\"amount\"]/100:.2f} {bal[\"currency\"].upper()}')
elif 'error' in data:
    print(f'✗ Stripe error: {data[\"error\"][\"message\"]}')
    sys.exit(1)
"
```

### Store
```bash
echo "STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY" >> ~/.open-your-eyes/secrets.env
echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" >> ~/.open-your-eyes/secrets.env
```

> ✓ Stripe is set up (test mode). I can now create products, set up checkout pages, and handle subscriptions.

---

## 8. Validation Gate 2: Full-Stack Smoke Test {#gate-2}

> Let's verify the full stack works. I'm going to:
> 1. Create a table in Supabase
> 2. Insert and read a row
> 3. Create a test product in Stripe
> 4. Clean up all test resources
>
> No charges will be made. Want me to go ahead?

### Steps the Agent Takes

```bash
source ~/.open-your-eyes/secrets.env

# 1. Create a test table in Supabase
curl -s "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS _oye_test (id serial primary key, message text, created_at timestamptz default now());"}'

# 2. Insert a row
curl -s "$SUPABASE_URL/rest/v1/_oye_test" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"message": "Hello from Open Your Eyes!"}'

# 3. Read it back
curl -s "$SUPABASE_URL/rest/v1/_oye_test?select=*" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# 4. Create a test product in Stripe
PRODUCT=$(curl -s https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d "name=OYE Test Product" \
  -d "description=Test product from Open Your Eyes validation")

PRODUCT_ID=$(echo $PRODUCT | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "✓ Created Stripe product: $PRODUCT_ID"

# 5. Clean up
curl -s "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "DROP TABLE IF EXISTS _oye_test;"}'

curl -s -X DELETE "https://api.stripe.com/v1/products/$PRODUCT_ID" \
  -u "$STRIPE_SECRET_KEY:"

echo "✓ Test resources cleaned up"
```

### Success
> 🎉 **Tier 2 complete!** Database and payments are working.
>
> I can now build full-stack apps with:
> - Postgres database (via Supabase)
> - User authentication
> - File storage
> - Payment processing (Stripe)
> - Auto-deployment to your domain
>
> Want to continue to Tier 3 (email + monitoring) or stop here?

---

# TIER 3: Production Polish

*After this tier, the agent can send emails from your app and track errors in production.*

---

## 9. Transactional Email — Resend

### Why Resend?
Modern email API with excellent developer experience. Free tier: 100 emails/day, 3,000/month. The agent can send password resets, welcome emails, notifications — anything your app needs.

### Check
> Do you already have a Resend account?

→ **YES**: Skip to [Get API Key](#resend-key)
→ **NO**: Continue below

### Create Account
> Let's set up Resend:
>
> 1. **Go to** [resend.com/signup](https://resend.com/signup)
> 2. **Sign up** with GitHub or email
> 3. You'll land on the Resend dashboard

### Add Domain (Required for production sending)
> To send emails from your own domain (e.g., `noreply@yourdomain.com`):
>
> 1. Go to **Domains** in the left sidebar
> 2. Click **"Add Domain"**
> 3. Enter your domain (e.g., `yourdomain.com`)
> 4. Resend will show you **DNS records to add** (SPF, DKIM, etc.)
> 5. Add these records in **Cloudflare**:
>    - Go to your domain in Cloudflare → **DNS** → **Records**
>    - Add each record Resend shows you (usually 2-3 TXT records and 1-2 CNAME records)
> 6. Back in Resend, click **"Verify"** — it may take a few minutes for DNS to propagate
>
> 💡 You can skip this for now and send from Resend's default domain during development (`onboarding@resend.dev`).

### Get API Key {#resend-key}
> Create an API key:
>
> 1. Go to **API Keys** in the left sidebar (or [resend.com/api-keys](https://resend.com/api-keys))
> 2. Click **"Create API Key"**
> 3. **Name**: `open-your-eyes`
> 4. **Permission**: "Full Access" (or "Sending Access" if you prefer minimal permissions)
> 5. **Copy the key** — starts with `re_`

### Collect Key
> Please paste your Resend API key (starts with `re_`):

### Validate
```bash
RESEND_API_KEY="<pasted key>"

curl -s https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'data' in data:
    domains = data['data']
    print(f'✓ Resend API works! {len(domains)} domain(s) configured:')
    for d in domains:
        status = '✓' if d.get('status') == 'verified' else '⏳'
        print(f'  {status} {d[\"name\"]} ({d.get(\"status\", \"unknown\")})')
elif 'statusCode' in data and data['statusCode'] == 401:
    print('✗ Invalid API key')
    sys.exit(1)
else:
    print(f'✓ Resend API works! (No custom domains configured yet — you can send from onboarding@resend.dev)')
"
```

### Store
```bash
echo "RESEND_API_KEY=$RESEND_API_KEY" >> ~/.open-your-eyes/secrets.env
```

> ✓ Resend is set up. I can now send transactional emails from your app.

---

## 10. Final Validation Gate: End-to-End {#gate-3}

> Let's do a final end-to-end test. I'm going to:
> 1. Send a test email to your address via Resend
> 2. Confirm you receive it
>
> What email address should I send the test to?

### Steps the Agent Takes

```bash
source ~/.open-your-eyes/secrets.env

# Send a test email
curl -s -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"Open Your Eyes <onboarding@resend.dev>\",
    \"to\": \"$USER_EMAIL\",
    \"subject\": \"It works! Your auto-deploy pipeline is ready.\",
    \"html\": \"<h1>Open Your Eyes</h1><p>Your AI agent can now deploy sites, manage databases, process payments, and send emails — all automatically.</p><p>Just describe what you want built.</p>\"
  }" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'id' in data:
    print(f'✓ Email sent! (ID: {data[\"id\"]})')
    print('  Check your inbox (and spam folder) for the test email.')
else:
    print(f'✗ Email failed: {json.dumps(data)}')
"
```

---

## 11. Credential Summary & What's Possible

After all tiers are complete, show the user:

> **Setup complete! Here's what I can now do for you:**
>
> | Capability | Service | Status |
> |-----------|---------|--------|
> | Deploy sites to your domain | Vercel + Cloudflare | ✓ |
> | Buy new domains | Porkbun | ✓/skipped |
> | Create and manage databases | Supabase | ✓ |
> | User authentication | Supabase Auth | ✓ |
> | File uploads and storage | Supabase Storage | ✓ |
> | Accept payments | Stripe | ✓ (test mode) |
> | Send emails | Resend | ✓ |
>
> **All credentials stored in** `~/.open-your-eyes/secrets.env`
>
> **To use this in any project**, just say: *"Build me [describe your app]"* — I'll handle the database schema, frontend, backend, deployment, domain setup, and everything in between.
>
> **To switch Stripe to live mode** when you're ready for real payments, replace the test keys in `~/.open-your-eyes/secrets.env` with live keys from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys).

### Validation Log
Write to `~/.open-your-eyes/validation-log.json`:
```json
{
  "last_validated": "2024-01-15T10:30:00Z",
  "services": {
    "vercel": { "status": "ok", "account": "username" },
    "cloudflare": { "status": "ok", "domain": "yourdomain.com", "zone_id": "abc123" },
    "porkbun": { "status": "ok" },
    "supabase": { "status": "ok", "project_url": "https://abc.supabase.co" },
    "stripe": { "status": "ok", "mode": "test" },
    "resend": { "status": "ok", "domains": ["yourdomain.com"] }
  }
}
```

---

## Appendix A: Alternative Providers

<details>
<summary>Netlify (alternative to Vercel)</summary>

### Create Account
1. Go to [app.netlify.com/signup](https://app.netlify.com/signup)
2. Sign up with GitHub

### Get API Token
1. Go to [app.netlify.com/user/applications#personal-access-tokens](https://app.netlify.com/user/applications#personal-access-tokens)
2. Click "New access token"
3. Name: `open-your-eyes`
4. Copy the token

### Validate
```bash
curl -s -H "Authorization: Bearer $NETLIFY_TOKEN" https://api.netlify.com/api/v1/sites | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    print(f'✓ Netlify works! {len(data)} site(s) on account')
"
```

### Store
```bash
echo "NETLIFY_TOKEN=$NETLIFY_TOKEN" >> ~/.open-your-eyes/secrets.env
```
</details>

<details>
<summary>Namecheap (alternative to Porkbun)</summary>

### Enable API Access
1. Go to [ap.www.namecheap.com/settings/tools/apiaccess](https://ap.www.namecheap.com/settings/tools/apiaccess)
2. Toggle API Access ON
3. Add your IP to the whitelist
4. Note your API key

⚠️ Namecheap requires $50+ in account spending or 20+ domains to enable API access.

### Validate
```bash
curl -s "https://api.namecheap.com/xml.response?ApiUser=$NC_USER&ApiKey=$NC_API_KEY&UserName=$NC_USER&ClientIp=$NC_IP&Command=namecheap.domains.getList"
```

### Store
```bash
echo "NAMECHEAP_API_USER=$NC_USER" >> ~/.open-your-eyes/secrets.env
echo "NAMECHEAP_API_KEY=$NC_API_KEY" >> ~/.open-your-eyes/secrets.env
```
</details>

<details>
<summary>Cloudflare Pages (alternative to Vercel)</summary>

### Setup
If you already have Cloudflare set up from the DNS step, you can use Cloudflare Pages for hosting too — no additional API token needed. Your existing token just needs the "Cloudflare Pages: Edit" permission.

### Update Token Permissions
1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Edit your existing token
3. Add permission: Account → Cloudflare Pages → Edit
4. Save

No additional storage needed — uses the same `CLOUDFLARE_API_TOKEN`.
</details>

---

## Appendix B: Refreshing & Rotating Keys

> It's good practice to rotate API keys periodically. Here's how to refresh each one:

| Service | Where to rotate | What to update |
|---------|----------------|----------------|
| Vercel | [vercel.com/account/tokens](https://vercel.com/account/tokens) | `VERCEL_TOKEN` |
| Cloudflare | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) | `CLOUDFLARE_API_TOKEN` |
| Porkbun | [porkbun.com/account/api](https://porkbun.com/account/api) | `PORKBUN_API_KEY` + `PORKBUN_SECRET_KEY` |
| Supabase | Project Settings → API | `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) | `STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` |
| Resend | [resend.com/api-keys](https://resend.com/api-keys) | `RESEND_API_KEY` |

To re-validate after rotation, tell the agent: *"Re-run the playbook validations"*

---

## Appendix C: The secrets.env File

When complete, `~/.open-your-eyes/secrets.env` looks like:

```bash
# Tier 1: Deploy
VERCEL_TOKEN=your_vercel_token
CLOUDFLARE_API_TOKEN=your_cf_token
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_DOMAIN=yourdomain.com
PORKBUN_API_KEY=pk1_xxx
PORKBUN_SECRET_KEY=sk1_xxx

# Tier 2: Full-Stack
SUPABASE_URL=https://abc.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ACCESS_TOKEN=sbp_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Tier 3: Polish
RESEND_API_KEY=re_xxx
```
