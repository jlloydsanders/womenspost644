# Women's Post 644 — Decap CMS Setup Guide

## What This Does

Your existing site design is kept exactly as-is. Decap CMS adds a
password-protected admin panel at **yoursite.netlify.app/admin** where
post members can log in and upload photos, meeting minutes, and
newsletters — no GitHub, no code.

---

## Folder Structure

```
womenspost644/
├── admin/
│   ├── index.html        ← The CMS login page
│   └── config.yml        ← Defines what editors can manage
├── content/
│   ├── photos/           ← CMS creates .md files here per photo
│   ├── minutes/          ← CMS creates .md files here per upload
│   ├── newsletters/      ← CMS creates .md files here per upload
│   ├── events/           ← CMS creates .md files here per event
│   ├── news/             ← CMS creates .md files here per post
│   └── settings/
│       └── post-info.json ← Phone, email, address, etc.
├── public/
│   ├── index.html        ← Your website
│   ├── content-index.json ← Auto-generated at build time
│   └── uploads/          ← Photos and PDFs land here
├── scripts/
│   └── build-content-index.js  ← Runs at deploy, builds content-index.json
├── netlify.toml
└── package.json
```

---

## One-Time Setup Steps (You Do This Once)

### Step 1 — Push these files to GitHub
Replace everything in your `jlloydsanders/womenspost644` repo with
these files. Using GitHub Desktop:
- Copy all files into your local repo folder
- Commit and push to main

### Step 2 — Enable Netlify Identity
1. Go to your Netlify dashboard → your site
2. Click **"Integrations"** → search **"Identity"** → Enable it
3. Under Identity settings → **Registration** → set to **"Invite only"**
   (This means only people YOU invite can log in — important!)

### Step 3 — Enable Git Gateway
1. Still in Identity settings → scroll to **"Git Gateway"**
2. Click **"Enable Git Gateway"**
   (This lets the CMS write files back to your GitHub repo)

### Step 4 — Invite yourself first
1. Identity → **"Invite users"** → enter your email
2. Check your email, accept the invite, set a password
3. Go to **yoursite.netlify.app/admin** — you should be able to log in

That's it. The site is live.

---

## How to Add Members as Uploaders

When a new Commander, Secretary, or other member needs upload access:

1. Netlify Dashboard → your site → **Identity**
2. Click **"Invite users"**
3. Enter their email address
4. They receive an email, click the link, set their own password
5. They can now log in at **yoursite.netlify.app/admin**

**To remove access when someone leaves a role:**
1. Identity → find their name in the user list
2. Click their name → **"Delete user"**
3. Done — they can no longer log in

No GitHub access needed. No passwords to share. Each person has
their own login tied to their email.

---

## What Uploaders See at /admin

When a member logs into the admin panel they see:

| Menu Item | What They Can Do |
|---|---|
| 📷 Photo Gallery | Upload photos, choose category, add caption |
| 📋 Meeting Minutes | Upload PDF, pick meeting type and date |
| 📰 Newsletters | Upload PDF newsletter, add description |
| 📅 Events | Add/edit upcoming events shown on homepage |
| 📣 News & Announcements | Write news posts shown on homepage |
| ⚙️ Site Settings | Update phone, email, address, dues amount |

Each item has a **"Show on Website"** toggle — if they make a mistake
they can hide it without deleting it.

---

## How Publishing Works

1. Member logs into /admin
2. Uploads a photo or PDF, fills in the fields, clicks **Publish**
3. Decap CMS commits the file to your GitHub repo automatically
4. Netlify detects the commit, runs the build (takes ~30 seconds)
5. The content appears on the live site

Members don't need to know any of this is happening. To them it's
just: fill in the form → click Publish → done.

---

## Role Summary

| Role | Access | How to Grant |
|---|---|---|
| **Site Admin** (you) | Full Netlify + GitHub access | You already have this |
| **Uploader** (Commander, Secretary, etc.) | /admin panel only | Netlify Identity invite |
| **Visitor** | Public website only | No action needed |

---

## Transferring Roles When Leadership Changes

When a new Commander takes over:
1. Invite the new person via Netlify Identity (Step above)
2. Delete the outgoing person's Identity account
3. No GitHub access ever needs to change
4. No passwords need to be shared

---

## Costs

| Service | Cost |
|---|---|
| Netlify hosting | Free |
| Netlify Identity | Free (up to 1,000 active users) |
| Git Gateway | Free |
| GitHub repo | Free |
| **Total** | **$0/month** |

---

## Troubleshooting

**"I can't log into /admin"**
→ Make sure you accepted the invite email and set a password.
→ Make sure Git Gateway is enabled in Netlify.

**"I uploaded a photo but it's not showing on the site"**
→ Wait 60 seconds for Netlify to rebuild.
→ Check that "Show on Website" was toggled ON before publishing.

**"The build failed"**
→ Check Netlify dashboard → Deploys → click the failed deploy to see the error log.
→ Usually means a malformed content file — contact your site admin.
