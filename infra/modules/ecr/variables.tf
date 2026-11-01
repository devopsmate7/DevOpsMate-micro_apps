variable "prefix" {
  description = "Repository name prefix, e.g. devopsmate -> devopsmate/auth."
  type        = string
}

variable "repositories" {
  description = "One ECR repository is created per entry."
  type        = list(string)
}

variable "keep_images" {
  description = "How many images to retain per repository."
  type        = number
  default     = 30
}

variable "force_delete" {
  description = "Allow terraform destroy to delete repositories that still contain images."
  type        = bool
  default     = false
}
