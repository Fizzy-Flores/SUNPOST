terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = ">= 0.16"
    }
  }
}

provider "vercel" {
  api_token = "vcp_7b8Tq1hjHjui8fS5I5odY9AKzpOQzENmWRAsPQu45Msx7HLAhd3C5hvO"
  team = "team_D4VGmYgaoEIZuBgTSCEbKrBl"
}

# Deploy frontend to Vercel
resource "vercel_project" "sunpost_frontend" {
  name = "sunpost-frontend"
  framework = "python"

  git_repository = {
    type = "github"
    repo = "https://github.com/Fizzy-Flores/SUNPOST"
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
