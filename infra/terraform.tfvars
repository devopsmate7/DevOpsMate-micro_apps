project     = "devopsmate"
environment = "prod"
region      = "ap-south-1"

# Network
vpc_cidr           = "10.0.0.0/16"
az_count           = 2
single_nat_gateway = true

# EKS
cluster_version     = "1.34"
node_instance_types = ["t3.medium"]
node_capacity_type  = "ON_DEMAND"
node_min_size       = 2
node_max_size       = 4
node_desired_size   = 2

# Add your own IAM user/role ARN here to use kubectl against the cluster.
cluster_admin_arns = []

# Data
users_table_name                = "devopsmate_users"
users_table_deletion_protection = true

# Add-on chart versions
alb_controller_chart_version = "1.13.0"
argocd_chart_version         = "8.0.0"
argocd_apps_chart_version    = "2.0.2"

# GitOps (argocd_repo_url is overridden by the infra pipeline with this repo's URL)
argocd_repo_url        = "https://github.com/devopsmate7/DevOpsMate-micro_apps.git"
argocd_target_revision = "main"
argocd_repo_private    = false
