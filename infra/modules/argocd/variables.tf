variable "chart_version" {
  description = "argo-cd Helm chart version."
  type        = string
}

variable "apps_chart_version" {
  description = "argocd-apps Helm chart version."
  type        = string
}

variable "app_name" {
  description = "Name of the ArgoCD Application."
  type        = string
}

variable "app_namespace" {
  description = "Namespace the application is deployed into."
  type        = string
}

variable "repo_url" {
  description = "Git repository ArgoCD watches, e.g. https://github.com/org/repo.git."
  type        = string
}

variable "target_revision" {
  description = "Branch, tag, or commit ArgoCD tracks."
  type        = string
}

variable "app_path" {
  description = "Path inside the repo that holds the Kubernetes manifests."
  type        = string
}

variable "repo_private" {
  description = "Set true when the repo is private; repo_token is then required."
  type        = bool
}

variable "repo_token" {
  description = "GitHub token with read access to the repo (only used when repo_private = true)."
  type        = string
  sensitive   = true
}
