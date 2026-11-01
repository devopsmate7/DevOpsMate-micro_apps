# Remote state in the S3 bucket created by infra/bootstrap.
# bucket and region are passed at init time:
#   terraform init -backend-config=backend.hcl        (locally, see backend.hcl.example)
#   -backend-config="bucket=..." -backend-config="region=..."  (in GitHub Actions)
terraform {
  backend "s3" {
    key          = "devopsmate/infra.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}
