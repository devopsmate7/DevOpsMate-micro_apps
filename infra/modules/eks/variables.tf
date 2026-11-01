variable "cluster_name" {
  type = string
}

variable "cluster_version" {
  description = "Kubernetes version for the EKS control plane."
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "Private subnets for the control plane ENIs and worker nodes."
  type        = list(string)
}

variable "node_instance_types" {
  type = list(string)
}

variable "node_capacity_type" {
  description = "ON_DEMAND or SPOT."
  type        = string

  validation {
    condition     = contains(["ON_DEMAND", "SPOT"], var.node_capacity_type)
    error_message = "node_capacity_type must be ON_DEMAND or SPOT."
  }
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

variable "admin_principal_arns" {
  description = "Extra IAM users/roles that get cluster-admin (e.g. your own IAM user). Do not include the role that runs terraform; it is already admin."
  type        = list(string)
}
