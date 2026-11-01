output "state_bucket" {
  description = "GitHub repo variable TF_STATE_BUCKET."
  value       = aws_s3_bucket.state.bucket
}

output "infra_role_arn" {
  description = "GitHub repo secret AWS_INFRA_ROLE_ARN."
  value       = aws_iam_role.infra.arn
}

output "app_role_arn" {
  description = "GitHub repo secret AWS_APP_ROLE_ARN."
  value       = aws_iam_role.app.arn
}
