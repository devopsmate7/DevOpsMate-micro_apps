resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = var.chart_version
  namespace        = "argocd"
  create_namespace = true
}

# Only needed when the GitHub repo is private.
resource "kubernetes_secret" "repo" {
  count = var.repo_private ? 1 : 0

  metadata {
    name      = "${var.app_name}-repo"
    namespace = "argocd"
    labels = {
      "argocd.argoproj.io/secret-type" = "repository"
    }
  }

  data = {
    type     = "git"
    url      = var.repo_url
    username = "git"
    password = var.repo_token
  }

  depends_on = [helm_release.argocd]
}

# The ArgoCD Application that watches deploy/k8s in the repo and auto-syncs it.
resource "helm_release" "apps" {
  name       = "argocd-apps"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argocd-apps"
  version    = var.apps_chart_version
  namespace  = "argocd"

  values = [yamlencode({
    applications = {
      (var.app_name) = {
        namespace = "argocd"
        project   = "default"
        source = {
          repoURL        = var.repo_url
          targetRevision = var.target_revision
          path           = var.app_path
        }
        destination = {
          server    = "https://kubernetes.default.svc"
          namespace = var.app_namespace
        }
        syncPolicy = {
          automated = {
            prune    = true
            selfHeal = true
          }
          syncOptions = ["CreateNamespace=true"]
        }
      }
    }
  })]

  depends_on = [helm_release.argocd, kubernetes_secret.repo]
}
