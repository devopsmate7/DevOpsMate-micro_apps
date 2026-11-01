# ---------- General ----------
variable "project" {
  description = "Project name, used as a prefix for resources and as the app namespace."
  type        = string
}

variable "environment" {
  description = "Environment name, e.g. prod or dev."
  type        = string
}

variable "region" {
  description = "AWS region."
  type        = string
}

# ---------- Network ----------
variable "vpc_cidr" {
  type = string
}

variable "az_count" {
  type = number
}

variable "single_nat_gateway" {
  type = bool
}

# ---------- EKS ----------
variable "cluster_version" {
  description = "EKS Kubernetes version. Use a version in AWS standard support."
  type        = string
}

variable "node_instance_types" {
  type = list(string)
}

variable "node_capacity_type" {
  type = string
}

variable "node_min_size" {
  type = number
}

variable "node_max_size" {
  type = number
}

variable "node_desired_size" {
  type = number
}

variable "cluster_admin_arns" {
  description = "IAM users/roles (besides the terraform runner) that get kubectl admin access."
  type        = list(string)
  default     = []
}

# ---------- Data ----------
variable "users_table_name" {
  type = string
}

variable "users_table_deletion_protection" {
  type    = bool
  default = true
}

# ---------- Cluster add-ons ----------
variable "alb_controller_chart_version" {
  type = string
}

variable "argocd_chart_version" {
  type = string
}

variable "argocd_apps_chart_version" {
  type = string
}

# ---------- GitOps ----------
variable "argocd_repo_url" {
  description = "HTTPS URL of this GitHub repo. The infra pipeline sets it automatically."
  type        = string
}

variable "argocd_target_revision" {
  description = "Branch ArgoCD tracks."
  type        = string
  default     = "main"
}

variable "argocd_repo_private" {
  description = "Set true if the GitHub repo is private (then argocd_repo_token is required)."
  type        = bool
  default     = false
}

variable "argocd_repo_token" {
  description = "Read-only GitHub token for ArgoCD. Pass via TF_VAR_argocd_repo_token, never in tfvars."
  type        = string
  sensitive   = true
  default     = ""
}
