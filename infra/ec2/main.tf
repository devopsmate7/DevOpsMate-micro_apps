data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_route53_zone" "public" {
  name         = var.route53_zone_name
  private_zone = false
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023*-kernel-6.1-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  name = "${var.project}-ec2"
}

# ---------- Network: one public subnet, no NAT gateway ----------
resource "aws_vpc" "this" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = local.name }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = local.name }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.20.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "${local.name}-public" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = { Name = "${local.name}-public" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "app" {
  name        = "${local.name}-app"
  description = "HTTP to the frontend container. SSH is closed; use SSM."
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-app" }
}

# ---------- Users table (same shape as the EKS stack) ----------
module "dynamodb" {
  source = "../modules/dynamodb"

  table_name          = var.users_table_name
  deletion_protection = false
}

data "aws_iam_policy_document" "dynamodb" {
  statement {
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]
    resources = [
      module.dynamodb.table_arn,
      "${module.dynamodb.table_arn}/index/*",
    ]
  }

  statement {
    actions   = ["dynamodb:ListTables"]
    resources = ["*"]
  }
}

resource "aws_iam_role" "instance" {
  name = "${local.name}-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "dynamodb" {
  name   = "dynamodb"
  role   = aws_iam_role.instance.id
  policy = data.aws_iam_policy_document.dynamodb.json
}

resource "aws_iam_instance_profile" "app" {
  name = "${local.name}-instance"
  role = aws_iam_role.instance.name
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name

  # Hop limit 2 lets the containers read the instance role from inside Docker.
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user-data.sh.tftpl", {
    repo_url    = "https://github.com/${var.github_repo}.git"
    region      = var.region
    table_name  = module.dynamodb.table_name
    jwt_secret  = random_password.jwt.result
    domain_name = var.domain_name
  })

  tags = { Name = local.name }

  depends_on = [aws_route_table_association.public]
}

# Fixed address so the DNS record does not change when the instance is replaced.
resource "aws_eip" "app" {
  domain = "vpc"
  tags   = { Name = local.name }
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.allocation_id
}

resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.public.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 60
  records = [aws_eip.app.public_ip]
}

# ---------- GitHub Actions deploy role ----------
resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]
}

locals {
  oidc_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "deploy_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name               = "${local.name}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.deploy_trust.json
}

data "aws_iam_policy_document" "deploy" {
  statement {
    actions = ["ssm:SendCommand"]
    resources = [
      "arn:aws:ssm:${var.region}::document/AWS-RunShellScript",
      aws_instance.app.arn,
    ]
  }

  statement {
    actions = [
      "ssm:GetCommandInvocation",
      "ssm:ListCommandInvocations",
    ]
    resources = ["*"]
  }

  statement {
    actions   = ["ec2:DescribeInstances"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "deploy"
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}
