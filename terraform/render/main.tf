# Render Backend Configuration
#
# NOTE: Render does NOT have an official Terraform provider yet.
# This directory contains documentation and configuration templates.
# Deploy your Render backend using:
#   1. The Render web dashboard, OR
#   2. The render.yaml file in WEBSITE/Sunpost/backend/
#
# Reference: https://render.com/docs

# For now, use the render.yaml approach:
# - Ensure WEBSITE/Sunpost/backend/render.yaml is configured
# - Push code to GitHub
# - Connect to Render via dashboard: https://dashboard.render.com
# - Set environment variables in Render UI
#
# Future: When Render releases Terraform provider, update this with:
# resource "render_web_service" "sunpost_backend" {
#   name              = "sunpost-backend"
#   plan              = "free" or "paid"
#   start_command     = "uvicorn main:app --host 0.0.0.0 --port $PORT"
#   environment_slug  = "python"
#   ...
# }

variable "render_api_key" {
  description = "Render API key (for future use when provider is available)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "backend_name" {
  description = "Name of the Render backend service"
  type        = string
  default     = "sunpost-backend"
}

variable "backend_url" {
  description = "Render backend URL (set after deployment)"
  type        = string
  default     = "https://sunpost-backend.onrender.com"
}

output "backend_url" {
  description = "Render backend service URL"
  value       = var.backend_url
}

output "render_documentation" {
  description = "Link to Render documentation"
  value       = "https://render.com/docs"
}
