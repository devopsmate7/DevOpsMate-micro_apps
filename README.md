# DevOpsMate

Course platform: React frontend + four FastAPI microservices, deployed to AWS EKS with
Terraform, GitHub Actions and ArgoCD (GitOps). Everything lives in this one repo.

## Repository layout

```
.
├── src/                        Application code
│   ├── frontend/               React (Vite) app served by nginx          :80
│   └── services/
│       ├── auth/               Signup/login/profile, users in DynamoDB   :8000
│       ├── catalog/            Courses                                   :8001
│       ├── commerce/           Cart + orders (SQLite on a volume)        :8002
│       └── notice/             Notice bar / announcements                :8003
├── infra/                      Terraform
│   ├── bootstrap/              One-time: state bucket + GitHub OIDC roles (run locally)
│   ├── modules/                vpc, eks, ecr, dynamodb, irsa-role, alb-controller, argocd
│   ├── main.tf                 Wires the modules together
│   ├── variables.tf
│   └── terraform.tfvars        Environment values (edit these)
├── deploy/k8s/                 Kustomize manifests ArgoCD syncs to the cluster
├── .github/workflows/
│   ├── infra.yml               Pipeline 1: terraform plan/apply/destroy
│   └── app.yml                 Pipeline 2: build images -> ECR -> bump tags in deploy/k8s
├── docker-compose.yml          Full local stack
└── scripts/run-local.sh        Run services directly on the host
```

## How a deployment flows

1. `infra.yml` creates the VPC, EKS cluster, ECR repos, DynamoDB users table, the AWS
   Load Balancer Controller and ArgoCD. ArgoCD is configured to watch `deploy/k8s` on `main`.
2. `app.yml` builds the 5 images, pushes them to ECR tagged with the commit SHA and commits
   the new tags to `deploy/k8s/kustomization.yaml`.
3. ArgoCD sees the commit and syncs the cluster. The Ingress becomes an internet-facing ALB:
   `/api/auth|catalog|commerce|notice` go to each service, everything else to the frontend.

The auth pod reaches DynamoDB through IRSA (no AWS keys in the cluster). The namespace,
service account, `devopsmate-config` and `devopsmate-secrets` (JWT secret) are created by
Terraform because they contain account-specific values.

## First-time setup

### 1. Bootstrap (once, from your machine, with admin AWS credentials)

Edit `infra/bootstrap/terraform.tfvars` and set `github_repo = "<owner>/<repo>"`, then:

```bash
cd infra/bootstrap
terraform init
terraform apply
terraform output
```

If the account already has the GitHub OIDC provider, set `create_github_oidc_provider = false`.

### 2. GitHub repository settings

| Type     | Name                 | Value                                        |
|----------|----------------------|----------------------------------------------|
| Secret   | `AWS_INFRA_ROLE_ARN` | bootstrap output `infra_role_arn`            |
| Secret   | `AWS_APP_ROLE_ARN`   | bootstrap output `app_role_arn`              |
| Variable | `TF_STATE_BUCKET`    | bootstrap output `state_bucket`              |
| Variable | `AWS_REGION`         | optional, defaults to `ap-south-1`           |
| Secret   | `ARGOCD_REPO_TOKEN`  | only if the repo is private (read-only PAT)  |

Also create an Environment named **`infra`** (Settings → Environments). Add required
reviewers there if you want a manual approval before apply/destroy.

If the repo is private, set `argocd_repo_private = true` in `infra/terraform.tfvars`.

### 3. Review `infra/terraform.tfvars`

Region, cluster version, node sizes, and `cluster_admin_arns` (IAM users/roles that should
get kubectl admin access, e.g. your SSO role).

### 4. Run the pipelines

1. Actions → **infra** → Run workflow → `apply` (later, pushes to `infra/**` apply automatically).
2. Actions → **app** → Run workflow (later, pushes to `src/**` deploy automatically).

### 5. Access

```bash
cd infra
terraform init -backend-config=backend.hcl   # copy backend.hcl.example first
terraform output configure_kubectl            # run the printed command
terraform output app_url                      # prints the command to get the ALB hostname
terraform output argocd_admin_password
kubectl -n argocd port-forward svc/argocd-server 8080:443   # ArgoCD UI on https://localhost:8080
```

## Tear down

Actions → **infra** → Run workflow → `destroy`. The job first removes the ArgoCD
application, Ingress and volumes so the ALB and EBS volume are not orphaned.
Then destroy `infra/bootstrap` locally if you no longer need the state bucket and roles.

## Local development

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:3000
- Auth API docs: http://localhost:8000/docs
- DynamoDB Local: http://localhost:8500
- Mail (welcome emails): http://localhost:8025

Without Docker for the services: `docker compose up -d dynamodb-local mailhog` then
`./scripts/run-local.sh`.

## Notes

- The ALB listens on HTTP only. Add an ACM certificate and the
  `alb.ingress.kubernetes.io/certificate-arn` annotation for HTTPS.
- SMTP is not configured on EKS; welcome emails are skipped until SMTP settings are added.
- Commerce stores data in SQLite on an EBS volume, so it runs as one replica.
- The infra GitHub role has AdministratorAccess for simplicity; scope it down for production.
