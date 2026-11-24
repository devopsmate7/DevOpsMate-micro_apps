# DevOpsMate

Website: https://devopsmate.in

Students sign up, log in, pick a course, and get a welcome email from devopsmate7@gmail.com.
Users are stored in DynamoDB. Orders are stored on the server.

## 1. Create the server (you do this)

In the new AWS account, region **Mumbai**:

1. Launch **Ubuntu**, size **t3.medium**. Allow ports **22**, **80**, and **443**. Turn on termination protection.
2. Attach an **Elastic IP**.
3. In DuckDNS, set `devopsmate7` to that IP.
4. Create a role named `DevOpsMateEC2DynamoDB` (trusted service: EC2) with this policy. Replace `ACCOUNT_ID`.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:DescribeTable", "dynamodb:CreateTable", "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"],
    "Resource": [
      "arn:aws:dynamodb:ap-south-1:ACCOUNT_ID:table/devopsmate_users",
      "arn:aws:dynamodb:ap-south-1:ACCOUNT_ID:table/devopsmate_users/index/*"
    ]
  }]
}
```

5. Attach that role to the instance.
6. Instance settings, Metadata options: set the **hop limit to 2**.

## 2. Start the site (one script)

SSH in as `ubuntu` and run:

```bash
bash start.sh
```

Upload `scripts/start.sh` first, or, if you already cloned the repo:

```bash
cd DevOpsMate-micro_apps
bash scripts/start.sh
```

It asks for the GitHub token and the Gmail app password, installs Docker, starts every container, and sends a test mail to devopsmate7@gmail.com. Then open https://devopsmate.in

The users table is created on first signup and starts empty.

## Update later

```bash
cd ~/DevOpsMate-micro_apps
git pull
sudo docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
```

## Laptop

```bash
docker compose up --build
```

Site: http://localhost:3000. Test mail stays on the laptop: http://localhost:8025
