project     = "devopsmate"
region      = "ap-south-1"
github_repo = "devopsmate7/DevOpsMate-micro_apps"

# Replace both before apply. The hosted zone must already exist in Route 53.
domain_name       = "app.example.com"
route53_zone_name = "example.com"

instance_type    = "t3.medium"
users_table_name = "devopsmate_users"

# Set false if infra/bootstrap already created the GitHub OIDC provider.
create_github_oidc_provider = true
