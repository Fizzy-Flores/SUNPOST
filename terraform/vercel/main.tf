terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.16"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

# Deploy frontend to Vercel
resource "vercel_project" "sunpost_frontend" {
  name = var.project_name

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  root_directory = var.deployment_source

  environment = [
    {
      key    = "SUNPOST_BACKEND_URL"
      value  = var.api_url
      target = ["production", "preview", "development"]
    }
  ]
}
