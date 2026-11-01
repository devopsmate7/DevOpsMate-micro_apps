# IAM role a Kubernetes service account can assume (IRSA), so pods get AWS
# permissions without static keys.
resource "aws_iam_policy" "this" {
  name   = var.role_name
  policy = var.policy_json
}

module "irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.55"

  role_name        = var.role_name
  role_policy_arns = { app = aws_iam_policy.this.arn }

  oidc_providers = {
    main = {
      provider_arn               = var.oidc_provider_arn
      namespace_service_accounts = ["${var.namespace}:${var.service_account}"]
    }
  }
}
