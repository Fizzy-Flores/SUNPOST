terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = ">= 0.16"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
  team  = var.vercel_team_id

}

# Deploy frontend to Vercel
resource "vercel_project" "sunpost_frontend" {
  name = "sunpost-frontend"
  framework = "python"

  git_repository = {
    type = "github"
    repo = "Fizzy-Flores/SUNPOST"
  }

  root_directory = "SUNPOST"

  environment = [
    {
      key    = "SUNPOST_BACKEND_URL"
      value  = "sunpost-backend.onrender.com"
      target = ["production", "preview", "development"]
      sensitive = false
    }
  ]
}

resource "vercel_deployment" "initial_deploy" {
  project_id = "prj_dC8v29KFD3ou3BLpLfdWePu8eLaH"
  production = true
}

