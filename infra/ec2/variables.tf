variable "project" {
  type    = string
  default = "devopsmate"
}

variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "github_repo" {
  description = "GitHub repository in owner/name form. The instance clones this, and GitHub Actions assumes the deploy role for it."
  type        = string
}

variable "domain_name" {
  description = "Name visitors type, for example app.example.com. An A record is created for it."
  type        = string

  validation {
    condition     = var.domain_name != "" && var.domain_name != "app.example.com"
    error_message = "Set domain_name in terraform.tfvars to your real domain."
  }
}

variable "route53_zone_name" {
  description = "Existing public Route 53 hosted zone, for example example.com. Registering the domain and creating this zone is done outside Terraform."
  type        = string

  validation {
    condition     = var.route53_zone_name != "" && var.route53_zone_name != "example.com"
    error_message = "Set route53_zone_name in terraform.tfvars to your Route 53 hosted zone."
  }
}

variable "instance_type" {
  description = "Needs enough memory to build the images on the box."
  type        = string
  default     = "t3.medium"
}

variable "users_table_name" {
  type    = string
  default = "devopsmate_users"
}

variable "create_github_oidc_provider" {
  description = "Set false if this AWS account already has the GitHub OIDC provider (for example after infra/bootstrap)."
  type        = bool
  default     = true
}
