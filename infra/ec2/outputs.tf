output "site_url" {
  value = "http://${var.domain_name}"
}

output "public_ip" {
  value = aws_eip.app.public_ip
}

output "instance_id" {
  value = aws_instance.app.id
}

output "deploy_role_arn" {
  description = "Put this in the GitHub secret AWS_EC2_ROLE_ARN."
  value       = aws_iam_role.deploy.arn
}
