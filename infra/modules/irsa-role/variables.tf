variable "role_name" {
  type = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "namespace" {
  type = string
}

variable "service_account" {
  type = string
}

variable "policy_json" {
  description = "IAM policy document granted to the role."
  type        = string
}
