locals {
  name          = "${var.project}-${var.environment}"
  app_namespace = var.project
  services      = ["frontend", "auth", "catalog", "commerce", "notice"]
}

# ---------- Network ----------
module "vpc" {
  source = "./modules/vpc"

  name               = local.name
  cidr               = var.vpc_cidr
  az_count           = var.az_count
  single_nat_gateway = var.single_nat_gateway
}

# ---------- Kubernetes cluster ----------
module "eks" {
  source = "./modules/eks"

  cluster_name    = local.name
  cluster_version = var.cluster_version
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids

  node_instance_types = var.node_instance_types
  node_capacity_type  = var.node_capacity_type
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
  node_desired_size   = var.node_desired_size

  admin_principal_arns = var.cluster_admin_arns
}

# ---------- Container registry (one repo per service) ----------
module "ecr" {
  source = "./modules/ecr"

  prefix       = var.project
  repositories = local.services
}

# ---------- Users table ----------
module "dynamodb" {
  source = "./modules/dynamodb"

  table_name          = var.users_table_name
  deletion_protection = var.users_table_deletion_protection
}

# ---------- Auth service AWS access (DynamoDB via IRSA) ----------
data "aws_iam_policy_document" "auth_dynamodb" {
  statement {
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]
    resources = [
      module.dynamodb.table_arn,
      "${module.dynamodb.table_arn}/index/*",
    ]
  }

  # The auth service checks the table exists on startup.
  statement {
    actions   = ["dynamodb:ListTables"]
    resources = ["*"]
  }
}

module "auth_irsa" {
  source = "./modules/irsa-role"

  role_name         = "${local.name}-auth"
  oidc_provider_arn = module.eks.oidc_provider_arn
  namespace         = local.app_namespace
  service_account   = "auth"
  policy_json       = data.aws_iam_policy_document.auth_dynamodb.json
}

# ---------- Load balancer controller (turns the Ingress into an ALB) ----------
module "alb_controller" {
  source = "./modules/alb-controller"

  cluster_name      = module.eks.cluster_name
  region            = var.region
  vpc_id            = module.vpc.vpc_id
  oidc_provider_arn = module.eks.oidc_provider_arn
  chart_version     = var.alb_controller_chart_version

  depends_on = [module.eks]
}

# ---------- Cluster objects the app manifests rely on ----------
# Kept in Terraform (not git) because they hold account-specific ARNs and secrets.
resource "kubernetes_namespace" "app" {
  metadata {
    name = local.app_namespace
  }

  depends_on = [module.eks]
}

resource "kubernetes_service_account" "auth" {
  metadata {
    name      = "auth"
    namespace = kubernetes_namespace.app.metadata[0].name
    annotations = {
      "eks.amazonaws.com/role-arn" = module.auth_irsa.role_arn
    }
  }
}

resource "kubernetes_config_map" "app" {
  metadata {
    name      = "${var.project}-config"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    AWS_REGION           = var.region
    DYNAMODB_TABLE_USERS = module.dynamodb.table_name
  }
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "kubernetes_secret" "app" {
  metadata {
    name      = "${var.project}-secrets"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    JWT_SECRET = random_password.jwt.result
  }
}

# EBS-backed default storage class (commerce keeps its orders database on a volume).
resource "kubernetes_storage_class" "gp3" {
  metadata {
    name = "gp3"
    annotations = {
      "storageclass.kubernetes.io/is-default-class" = "true"
    }
  }

  storage_provisioner    = "ebs.csi.aws.com"
  reclaim_policy         = "Delete"
  volume_binding_mode    = "WaitForFirstConsumer"
  allow_volume_expansion = true

  parameters = {
    type      = "gp3"
    encrypted = "true"
  }

  depends_on = [module.eks]
}

# ---------- GitOps: ArgoCD + the Application that syncs deploy/k8s ----------
module "argocd" {
  source = "./modules/argocd"

  chart_version      = var.argocd_chart_version
  apps_chart_version = var.argocd_apps_chart_version

  app_name        = var.project
  app_namespace   = local.app_namespace
  repo_url        = var.argocd_repo_url
  target_revision = var.argocd_target_revision
  app_path        = "deploy/k8s"
  repo_private    = var.argocd_repo_private
  repo_token      = var.argocd_repo_token

  depends_on = [module.eks, module.alb_controller, kubernetes_namespace.app]
}
