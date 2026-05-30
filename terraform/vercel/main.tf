terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = ">= 0.16"
    }
  }
}

provider "vercel" {
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
