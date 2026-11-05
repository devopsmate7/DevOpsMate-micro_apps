#!/usr/bin/env bash
# Run once per AWS account (or after creating a new EC2 instance), anywhere the
# AWS CLI has admin access. Easiest: AWS console -> CloudShell (Mumbai), upload this file, then:
#   bash setup-aws-role.sh i-0123456789abcdef0
#
# Gives the instance access to the devopsmate_users DynamoDB table through an IAM role,
# so no AWS keys are ever stored on the server, and sets the metadata hop limit to 2
# so the Docker containers can use that role. Safe to run again.
set -euo pipefail

INSTANCE_ID="${1:?Usage: bash setup-aws-role.sh <ec2-instance-id>}"
REGION="${AWS_REGION:-ap-south-1}"
TABLE="devopsmate_users"
ROLE="DevOpsMateEC2DynamoDB"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
echo "Account ${ACCOUNT}, region ${REGION}, instance ${INSTANCE_ID}"

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]
}'

TABLE_POLICY="{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Action\": [\"dynamodb:DescribeTable\", \"dynamodb:CreateTable\", \"dynamodb:GetItem\",
                 \"dynamodb:PutItem\", \"dynamodb:UpdateItem\", \"dynamodb:Query\"],
    \"Resource\": [\"arn:aws:dynamodb:${REGION}:${ACCOUNT}:table/${TABLE}\",
                   \"arn:aws:dynamodb:${REGION}:${ACCOUNT}:table/${TABLE}/index/*\"]
  }]
}"

ATTACHED_ARN="$(aws ec2 describe-iam-instance-profile-associations --region "$REGION" \
  --filters "Name=instance-id,Values=${INSTANCE_ID}" "Name=state,Values=associated" \
  --query 'IamInstanceProfileAssociations[0].IamInstanceProfile.Arn' --output text)"

if [ "$ATTACHED_ARN" != "None" ] && [ -n "$ATTACHED_ARN" ]; then
  # Keep the role the instance already has (it may carry other permissions) and add table access to it.
  PROFILE="${ATTACHED_ARN##*/}"
  TARGET_ROLE="$(aws iam get-instance-profile --instance-profile-name "$PROFILE" \
    --query 'InstanceProfile.Roles[0].RoleName' --output text)"
  echo "== Instance already has role ${TARGET_ROLE}; adding DynamoDB access to it =="
else
  TARGET_ROLE="$ROLE"
  echo "== Creating role ${ROLE} =="
  if ! aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
    aws iam create-role --role-name "$ROLE" --assume-role-policy-document "$TRUST_POLICY" >/dev/null
  fi
  if ! aws iam get-instance-profile --instance-profile-name "$ROLE" >/dev/null 2>&1; then
    aws iam create-instance-profile --instance-profile-name "$ROLE" >/dev/null
    aws iam add-role-to-instance-profile --instance-profile-name "$ROLE" --role-name "$ROLE"
  fi
fi

aws iam put-role-policy --role-name "$TARGET_ROLE" --policy-name DevOpsMateUsersTable \
  --policy-document "$TABLE_POLICY"

if [ "$TARGET_ROLE" = "$ROLE" ] && { [ "$ATTACHED_ARN" = "None" ] || [ -z "$ATTACHED_ARN" ]; }; then
  echo "== Attaching role to the instance =="
  # A new instance profile takes a few seconds to become visible to EC2.
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if aws ec2 associate-iam-instance-profile --region "$REGION" --instance-id "$INSTANCE_ID" \
      --iam-instance-profile "Name=${ROLE}" >/dev/null 2>&1; then
      break
    fi
    [ "$attempt" -eq 10 ] && { echo "Could not attach the role. Attach ${ROLE} in the EC2 console."; exit 1; }
    sleep 6
  done
fi

echo "== Setting metadata hop limit to 2 (needed by Docker containers) =="
aws ec2 modify-instance-metadata-options --region "$REGION" --instance-id "$INSTANCE_ID" \
  --http-endpoint enabled --http-put-response-hop-limit 2 >/dev/null

echo
echo "Done. Within about a minute the auth service connects to DynamoDB by itself."
echo "Check on the server:  curl -s localhost/api/auth/health   (expect {\"message\":\"ok\"})"
