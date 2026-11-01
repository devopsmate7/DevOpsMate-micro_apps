variable "cluster_name" {
  type = string
}

variable "region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "chart_version" {
  description = "aws-load-balancer-controller Helm chart version."
  type        = string
}
