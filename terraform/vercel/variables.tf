variable "vercel_api_token" {
  description = "Vercel personal access token"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "team_D4VGmYgaoEIZuBgTSCEbKrBl"
  type        = string
}

variable "project_name" {
  description = "sunpost-frontend"
  type        = string
  default     = "sunpost-frontend"
}

variable "github_repo" {
  description = "https://github.com/Fizzy-Flores/SUNPOST"
  type        = string
}

variable "api_url" {
  description = "https://sunpost-backend.onrender.com"
  type        = string
  default     = "https://sunpost-backend.onrender.com"
}

variable "deployment_source" {
  description = "SUNPOST"
  type        = string
  default     = "SUNPOST"
}
