#!/usr/bin/env bash
# One-shot setup of DevOpsMate on a NEW AWS account. Run in AWS CloudShell (region Mumbai):
#   bash create-aws-stack.sh
#
# Creates: IAM role (DynamoDB + SSM), security group (22/80/443), Ubuntu t3.medium EC2
# with termination protection, Elastic IP, and points devopsmate7.duckdns.org at it.
# On first boot the server clones the repo, writes .env, and starts all containers.
# Secrets are asked here and kept encrypted in SSM Parameter Store, never in git.
# The DynamoDB users table is created automatically by the app.
set -euo pipefail

REGION="${AWS_REGION:-ap-south-1}"
NAME="devopsmate"
ROLE="DevOpsMateEC2Role"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.medium}"
REPO="devopsmate7/DevOpsMate-micro_apps"
DOMAIN="devopsmate7"
export AWS_DEFAULT_REGION="$REGION"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
echo "AWS account ${ACCOUNT}, region ${REGION}"

if [ "$(aws ec2 describe-instances --filters "Name=tag:Name,Values=${NAME}" \
  "Name=instance-state-name,Values=pending,running,stopping,stopped" \
  --query 'length(Reservations[].Instances[])' --output text)" != "0" ]; then
  echo "An instance named ${NAME} already exists in this account. Nothing was created."
  exit 1
fi

echo
read -rsp "GitHub token with read access to ${REPO}: " GH_TOKEN; echo
read -rsp "Gmail app password for devopsmate7@gmail.com (16 letters): " GMAIL_PASS; echo
read -rsp "DuckDNS token (from duckdns.org, Enter to skip): " DUCK_TOKEN; echo
GMAIL_PASS="${GMAIL_PASS// /}"
[ -n "$GH_TOKEN" ] || { echo "GitHub token is required (the repo is private)."; exit 1; }
[ "${#GMAIL_PASS}" -eq 16 ] || { echo "Gmail app password must be 16 letters."; exit 1; }

echo "== Saving secrets in SSM Parameter Store (encrypted) =="
put() { aws ssm put-parameter --name "/${NAME}/$1" --type SecureString --overwrite --value "$2" >/dev/null; }
put github_token "$GH_TOKEN"
put gmail_app_password "$GMAIL_PASS"
if ! aws ssm get-parameter --name "/${NAME}/jwt_secret" >/dev/null 2>&1; then
  put jwt_secret "$(openssl rand -hex 32)"
fi

echo "== IAM role ${ROLE} =="
if ! aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  aws iam create-role --role-name "$ROLE" --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]
  }' >/dev/null
fi
aws iam put-role-policy --role-name "$ROLE" --policy-name DevOpsMateApp --policy-document "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    {\"Effect\": \"Allow\",
     \"Action\": [\"dynamodb:DescribeTable\", \"dynamodb:CreateTable\", \"dynamodb:GetItem\",
                  \"dynamodb:PutItem\", \"dynamodb:UpdateItem\", \"dynamodb:Query\"],
     \"Resource\": [\"arn:aws:dynamodb:${REGION}:${ACCOUNT}:table/devopsmate_users\",
                    \"arn:aws:dynamodb:${REGION}:${ACCOUNT}:table/devopsmate_users/index/*\"]},
    {\"Effect\": \"Allow\", \"Action\": \"ssm:GetParameter\",
     \"Resource\": \"arn:aws:ssm:${REGION}:${ACCOUNT}:parameter/${NAME}/*\"}
  ]
}"
# Lets you open a shell from the EC2 console (Connect -> Session Manager) without SSH.
aws iam attach-role-policy --role-name "$ROLE" \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
if ! aws iam get-instance-profile --instance-profile-name "$ROLE" >/dev/null 2>&1; then
  aws iam create-instance-profile --instance-profile-name "$ROLE" >/dev/null
  aws iam add-role-to-instance-profile --instance-profile-name "$ROLE" --role-name "$ROLE"
fi

echo "== Key pair and security group =="
if ! aws ec2 describe-key-pairs --key-names "${NAME}-key" >/dev/null 2>&1; then
  aws ec2 create-key-pair --key-name "${NAME}-key" --query KeyMaterial --output text > "${HOME}/${NAME}-key.pem"
  chmod 400 "${HOME}/${NAME}-key.pem"
  echo "SSH key saved to ${HOME}/${NAME}-key.pem (download it: Actions -> Download file)"
fi
VPC_ID="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
SG_ID="$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${NAME}-web" "Name=vpc-id,Values=${VPC_ID}" \
  --query 'SecurityGroups[0].GroupId' --output text)"
if [ "$SG_ID" = "None" ]; then
  SG_ID="$(aws ec2 create-security-group --group-name "${NAME}-web" --description "DevOpsMate web" \
    --vpc-id "$VPC_ID" --query GroupId --output text)"
  for port in 22 80 443; do
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port "$port" --cidr 0.0.0.0/0 >/dev/null
  done
fi

# Runs as root on the server's first boot. Log: /var/log/devopsmate-setup.log
USER_DATA="$(cat <<'BOOT'
#!/bin/bash
set -euxo pipefail
exec > /var/log/devopsmate-setup.log 2>&1
REGION=ap-south-1
# First-boot automatic updates hold the apt lock and would break the Docker install.
systemctl stop unattended-upgrades || true
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 5; done
snap install aws-cli --classic
P() { /snap/bin/aws ssm get-parameter --region "$REGION" --with-decryption --name "/devopsmate/$1" --query Parameter.Value --output text; }
# git reads the GitHub token from SSM each time, so it is never written to disk.
HELPER='!f() { test "$1" = get && echo username=x-access-token && echo "password=$(/snap/bin/aws ssm get-parameter --region ap-south-1 --with-decryption --name /devopsmate/github_token --query Parameter.Value --output text)"; }; f'
cd /home/ubuntu
sudo -u ubuntu -H git -c credential.helper= -c "credential.helper=$HELPER" \
  clone https://github.com/devopsmate7/DevOpsMate-micro_apps.git
cd DevOpsMate-micro_apps
sudo -u ubuntu -H git config credential.helper "$HELPER"
cat > .env <<ENV
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=devopsmate7@gmail.com
SMTP_PASSWORD=$(P gmail_app_password)
SMTP_FROM="DevOpsMate <devopsmate7@gmail.com>"
SMTP_TLS=true
JWT_SECRET=$(P jwt_secret)
ENV
chown ubuntu:ubuntu .env
chmod 600 .env
sudo -u ubuntu -H bash scripts/bootstrap-ec2.sh || true
echo "DEVOPSMATE SETUP FINISHED"
BOOT
)"

echo "== Launching ${INSTANCE_TYPE} =="
AMI="$(aws ssm get-parameter --name /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id \
  --query Parameter.Value --output text)"
INSTANCE_ID=""
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  # A new instance profile takes a few seconds before EC2 can use it.
  if INSTANCE_ID="$(aws ec2 run-instances --image-id "$AMI" --instance-type "$INSTANCE_TYPE" \
      --key-name "${NAME}-key" --security-group-ids "$SG_ID" \
      --iam-instance-profile "Name=${ROLE}" \
      --metadata-options HttpEndpoint=enabled,HttpTokens=required,HttpPutResponseHopLimit=2 \
      --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3}' \
      --disable-api-termination \
      --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${NAME}}]" \
      --user-data "$USER_DATA" --query 'Instances[0].InstanceId' --output text 2>/tmp/run-instances.err)"; then
    break
  fi
  [ "$attempt" -eq 10 ] && { echo "Could not launch the instance:"; cat /tmp/run-instances.err; exit 1; }
  sleep 6
done
echo "Instance ${INSTANCE_ID}"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"

echo "== Elastic IP =="
ALLOC_ID="$(aws ec2 allocate-address --domain vpc \
  --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=${NAME}}]" --query AllocationId --output text)"
aws ec2 associate-address --instance-id "$INSTANCE_ID" --allocation-id "$ALLOC_ID" >/dev/null
EIP="$(aws ec2 describe-addresses --allocation-ids "$ALLOC_ID" --query 'Addresses[0].PublicIp' --output text)"
echo "Elastic IP ${EIP}"

if [ -n "$DUCK_TOKEN" ]; then
  echo "== DuckDNS ${DOMAIN}.duckdns.org -> ${EIP}: $(curl -fsS "https://www.duckdns.org/update?domains=${DOMAIN}&token=${DUCK_TOKEN}&ip=${EIP}") =="
else
  echo "Set ${DOMAIN}.duckdns.org to ${EIP} on duckdns.org now (needed for HTTPS)."
fi

cat <<DONE

Done. The server is installing and building now (about 10 minutes).
  Site:      https://${DOMAIN}.duckdns.org
  Instance:  ${INSTANCE_ID}   IP: ${EIP}
  Progress:  EC2 console -> instance -> Connect -> Session Manager, then
             sudo tail -f /var/log/devopsmate-setup.log   (ends with DEVOPSMATE SETUP FINISHED)
DONE
