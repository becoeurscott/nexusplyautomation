# Chrome Web Store submission

Everything you need to paste in. **You have to do the submission yourself** — it
requires signing in as you, a one-time $5 developer registration fee, and
publishing under your identity.

Package to upload: **`../dist/nexusply-extension-0.1.0.zip`**

---

## Before you start

1. A Google account (use the one you want to own the listing long-term — moving
   a published extension between accounts later is painful).
2. $5 one-time developer registration at
   <https://chrome.google.com/webstore/devconsole>. Charged once, not per
   extension.

---

## Store listing fields

**Name**
```
NexusPly
```

**Short description** (132 char limit — this is 80)
```
Score your post and get hashtag suggestions while you browse TikTok and YouTube.
```

**Detailed description**
```
NexusPly tells you how strong a post is before you publish it.

Open the panel on TikTok or YouTube Studio, paste your caption, and get:

• A score out of 100, with a breakdown of hook, clarity, call to action and length
• Specific changes to make — not "add a stronger hook", but what to actually rewrite
• Hashtag and keyword suggestions matched to what you wrote

The extension connects to your NexusPly workspace with a token you generate in
Settings, and uses your existing creation credits. You need a NexusPly account
to use it.

It does not read the pages you visit. The only text it sees is what you type or
paste into the panel yourself.
```

**Category:** Productivity
**Language:** English

---

## Privacy fields

**Single purpose** (they ask for one sentence — keep it narrow, a broad answer
invites questions)
```
Scores social media captions and suggests hashtags for them.
```

**Privacy policy URL**
```
https://nexusplyautomation.com/privacy
```
Section 5 of that page covers the extension specifically.

### Permission justifications

This is the section that gets extensions rejected. Each answer says what the
permission is *for*, not what it *is*.

**`storage`**
```
Stores the user's NexusPly access token locally in their browser so they don't
have to paste it in on every page. Nothing else is stored.
```

**Host permission — `https://nexusplyautomation.com/*`**
```
The extension sends the caption the user typed into its panel to the NexusPly
API to be scored, and reads back the score and hashtag suggestions. This is the
only server it contacts.
```

**Content scripts on `tiktok.com` and `studio.youtube.com`**
```
The extension injects a small panel onto these two sites so the user can check a
caption where they are already working. It does not read page content: the panel
has its own text box, and only text the user types or pastes into it is sent
anywhere.
```

**Remote code:** answer **No**. All code is in the package; nothing is fetched
and executed at runtime.

### Data usage disclosures

Tick only:

- **Personally identifiable information** — No
- **Health / financial / authentication information** — No
- **Personal communications** — No
- **Location, web history, user activity** — No
- **Website content** — **No.** Worth being precise if asked: the extension
  reads nothing from the page. The text it sends is what the user typed into the
  extension's own box.

Then confirm all three certifications:
- Not selling data to third parties
- Not using or transferring data for purposes unrelated to the single purpose
- Not using or transferring data to determine creditworthiness or for lending

---

## Screenshots (required — at least one, 1280×800 or 640×400)

Take these yourself with the extension installed:

1. The panel open on a TikTok page showing a real score with its breakdown
2. The panel showing hashtag suggestions
3. The popup with "Connected"

A short screencast helps if a reviewer questions the content-script permission —
showing that the panel has its own text box answers the "why do you need access
to this site" question faster than any written justification.

---

## Expect a wait, and possibly a bounce

Content-script extensions that inject into third-party sites get a closer look
than most. Days to a few weeks is normal, and the most common bounce is
permission justification — which is why the answers above lead with purpose.

If it is rejected, the rejection email names the specific policy. Send it over
and it's usually a wording fix, not a rebuild.

Firefox (addons.mozilla.org) is a separate submission with its own queue. The
same package works there with minor manifest differences.

---

## After it's published

Bump `version` in `manifest.json` for every update — the store rejects a
re-upload at the same version. Rebuild the zip the same way:

```bash
cd extension && python -c "
import zipfile, os
SKIP = {'README.md', 'STORE-SUBMISSION.md', 'icons/icon.svg'}
with zipfile.ZipFile('../dist/nexusply-extension-VERSION.zip','w',zipfile.ZIP_DEFLATED) as z:
    for root,_,fs in os.walk('.'):
        for f in fs:
            rel = os.path.relpath(os.path.join(root,f),'.').replace('\\\\','/')
            if rel not in SKIP: z.write(os.path.join(root,f), rel)
"
```
