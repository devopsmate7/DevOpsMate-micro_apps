output "cluster_name" {
  value = module.eks.cluster_name
}

output "region" {
  value = var.region
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "users_table_name" {
  value = module.dynamodb.table_name
}

output "configure_kubectl" {
  description = "Run this to point kubectl at the cluster."
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
}

output "argocd_admin_password" {
  description = "Run this to read the initial ArgoCD admin password."
  value       = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
}

output "app_url" {
  description = "Run this to get the public load balancer address once ArgoCD has synced."
  value       = "kubectl -n ${local.app_namespace} get ingress ${var.project} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
}
