output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.sunpost_frontend.id
}

output "vercel_project_url" {
  description = "Vercel project production URL"
  value       = "https://${vercel_project.sunpost_frontend.name}.vercel.app"
}
