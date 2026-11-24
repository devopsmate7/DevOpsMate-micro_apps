# DevOpsMate

Website: **https://devopsmate.in**  
Repo (private): `devopsmate7/DevOpsMate-micro_apps`

Students sign up, log in, pick a course, and get a welcome email from `devopsmate7@gmail.com`.  
Users → DynamoDB. Orders / 1:1 bookings → SQLite on the server.

---

## Migrate to a new EC2 (short)

### A) AWS (Mumbai `ap-south-1`)

1. Launch **Ubuntu** `t3.medium` · enable **termination protection**
2. Security group: **22, 80, 443**
3. Attach an **Elastic IP** — copy that IP
4. IAM role `DevOpsMateEC2DynamoDB` on the instance (DynamoDB access to `devopsmate_users`) — prefer role, not access keys
5. Instance → Metadata → **hop limit = 2**

### B) Hostinger DNS

1. Domain `devopsmate.in` → DNS
2. **A** `@` → **new Elastic IP** · TTL `300`
3. Keep **CNAME** `www` → `devopsmate.in`

### C) Server setup (one script)

```bash
ssh -i your.pem ubuntu@NEW_ELASTIC_IP

# Option 1 — upload start.sh alone, then:
bash start.sh
# It asks for GitHub PAT (private repo) → clones → asks Gmail app password → builds

# Option 2 — if repo already cloned:
cd ~/DevOpsMate-micro_apps
bash scripts/start.sh
```

When prompted:

| Prompt | What to enter |
|--------|----------------|
| GitHub token | PAT with **repo** read on private `DevOpsMate-micro_apps` |
| Gmail app password | 16-letter app password for `devopsmate7@gmail.com` |

Open **https://devopsmate.in** when it finishes. Zoom / UPI defaults are already in compose + `.env.example`.

### D) Later updates

```bash
cd ~/DevOpsMate-micro_apps
git pull origin main
sudo docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
```

---

## Secrets (do not commit)

Keep these **only** in server `.env` (gitignored) or a password manager — never push to GitHub.

| Item | Used for |
|------|----------|
| GitHub PAT | Clone private repo on new EC2 |
| Gmail app password | SMTP welcome / booking mails |
| Zoom Account ID / Client ID / Secret | 1:1 Zoom meetings |
| AWS keys | Only if no EC2 IAM role (prefer role) |

On the laptop, a local file `SECRETS.local.md` can hold your copies (gitignored).

---

## Laptop

```bash
docker compose up --build
```

Site: http://localhost:3000 · MailHog: http://localhost:8025
