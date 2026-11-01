variable "project" {
  type = string
}

variable "region" {
  type = string
}

variable "github_repo" {
  description = "GitHub repository in owner/name form, e.g. my-org/devopsmate."
  type        = string
}

variable "state_bucket_name" {
  description = "Override the state bucket name. Defaults to <project>-tfstate-<account_id>."
  type        = string
  default     = ""
}

variable "create_github_oidc_provider" {
  description = "Set false if this AWS account already has the GitHub OIDC provider."
  type        = bool
  default     = true
}
