# DevOpsMate

Website: https://devopsmate7.duckdns.org

Students sign up, log in, pick a course, and get a welcome email from devopsmate7@gmail.com.
Users are stored in DynamoDB. Orders are stored on the server.

## New AWS account

Have these ready:

1. A GitHub token that can read this private repo.
2. The Gmail app password for devopsmate7@gmail.com.
3. The DuckDNS token from duckdns.org.

Then:

1. Log in to the new AWS account and set the region to Mumbai.
2. Open CloudShell (the `>_` icon).
3. Upload `scripts/create-aws-stack.sh` (Actions, Upload file).
4. Run `bash create-aws-stack.sh` and paste the three values. Typing stays hidden.
5. Wait about 10 minutes, then open https://devopsmate7.duckdns.org

The script creates the server, its permissions, a fixed IP, and starts every container.
The users table is created on first signup and starts empty. Signup, login, welcome email, courses, cart, and orders all work.

To watch it install, open the instance, choose Connect, then Session Manager:

```bash
sudo tail -f /var/log/devopsmate-setup.log
```

It is finished when the log shows `DEVOPSMATE SETUP FINISHED`.

## Update the live site

Connect the same way, then:

```bash
cd /home/ubuntu/DevOpsMate-micro_apps
git pull
sudo docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
```

## Run on a laptop

```bash
docker compose up --build
```

- Site: http://localhost:3000
- Welcome emails stay on this laptop: http://localhost:8025

## Files

| Path | What it is |
| --- | --- |
| `src/frontend` | The website |
| `src/services/auth` | Signup, login, welcome email |
| `src/services/catalog` | Courses |
| `src/services/commerce` | Cart and orders |
| `src/services/notice` | The notice at the top |
| `scripts/create-aws-stack.sh` | Creates everything on a new AWS account |
| `scripts/bootstrap-ec2.sh` | Installs Docker and starts the site on a server |
| `scripts/setup-gmail.sh` | Turns on real email on a server that is already running |
| `scripts/setup-aws-role.sh` | Gives an existing server access to DynamoDB |
