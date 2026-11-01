variable "table_name" {
  type = string
}

variable "deletion_protection" {
  description = "Block accidental deletion of the users table (including via terraform destroy)."
  type        = bool
  default     = true
}
