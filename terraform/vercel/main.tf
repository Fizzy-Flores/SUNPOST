terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = ">= 0.16"
    }
  }
}

provider "vercel" {
  api_token = "vcp_5ZUu7MWTEFvUx4RsuaYYzc7kycer4AfvH49QZKfIeroySJKx4D49OcDW"
  team = "team_D4VGmYgaoEIZuBgTSCEbKrBl"
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
