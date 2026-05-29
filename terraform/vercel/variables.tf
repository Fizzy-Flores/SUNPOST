variable "vercel_api_token" {
  description = "Vercel API token for authentication"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID"
  type        = string
}

variable "project_name" {
  description = "Name of the Vercel project"
  type        = string
  default     = "sunpost-frontend"
}

variable "github_repo" {
  description = "GitHub repository in format owner/repo"
  type        = string
}

variable "api_url" {
  description = "Backend API URL (your Render backend URL)"
  type        = string
  default     = "https://sunpost-backend.onrender.com"
}

variable "deployment_source" {
  description = "Root directory of the deployment within the GitHub repo"
  type        = string
  default     = "SUNPOST"
}
