# Terraform Explained Simply

## The Idea

Instead of clicking buttons in the Vercel dashboard to set up your website, you **write code** that says "I want this setup" and let Terraform build it for you.

## How It Works (Simple Version)

**Without Terraform (Manual):**
1. Go to Vercel website
2. Click "New Project"
3. Click "Connect GitHub"
4. Click "Deploy"
5. Click "Settings" → "Environment"
6. Add variables by clicking buttons
→ Slow and easy to mess up

**With Terraform (Automatic):**
1. Write a text file describing what you want
2. Run: `terraform apply`
3. Terraform builds everything automatically
→ Fast, repeatable, no clicking

## Your Setup: SunPost

```
Frontend (Vercel)          Backend (Render)
├─ Described in           ├─ Described in
│  terraform/vercel/main.tf  render.yaml
├─ Auto-deploys           ├─ Manual deploy
│  from GitHub            │  from GitHub
└─ Terraform manages      └─ Render manages
```

## What Terraform Does for Your Frontend

1. **Creates a Vercel project** with your settings
2. **Connects your GitHub repo** so code auto-deploys
3. **Sets environment variables** (API URL, etc.)
4. **Manages domains and URLs**

## What You Don't Terraform (Backend)

**Why?** Render doesn't support Terraform yet, so:
- Use `render.yaml` instead (already created)
- Deploy manually via Render dashboard
- Terraform works for Vercel only

## Three Key Files

### 1. `main.tf` - The Recipe
```hcl
resource "vercel_project" "sunpost_frontend" {
  name = "sunpost-frontend"
  # ... more settings ...
}
```
"Create a Vercel project called sunpost-frontend"

### 2. `variables.tf` - The Ingredients
```hcl
variable "vercel_api_token" {
  type = string
}
```
"I need your Vercel API token to build this"

### 3. `terraform.tfvars` - Your Shopping List
```hcl
vercel_api_token = "abc123..."
vercel_team_id   = "xyz789..."
```
"Here are my credentials, use these"

## How to Use It

### Step 1: Get Your Credentials
- Go to https://vercel.com/account/tokens
- Create a token (copy it)
- Go to Vercel Settings → find your Team ID (copy it)

### Step 2: Create terraform.tfvars
```bash
cd terraform/vercel
cp terraform.tfvars.example terraform.tfvars
```

### Step 3: Fill in Your Values
Edit `terraform.tfvars`:
```hcl
vercel_api_token = "YOUR_TOKEN_HERE"
vercel_team_id   = "YOUR_TEAM_ID_HERE"
github_repo      = "yourusername/sunpost"
```

### Step 4: Deploy
```bash
terraform init    # Download plugins
terraform plan    # Show what will be built
terraform apply   # Build it!
```

Done! Your frontend is deployed. ✅

## What Happens After

- **Every `git push`** → Vercel automatically redeploys
- **Changes in code** → Automatically deployed
- **You don't touch Vercel UI** → Terraform is the source of truth

## Key Advantage: Reproducible

If you want to:
- Create another project with same settings → `terraform apply` again
- Destroy and recreate → `terraform destroy` then `terraform apply`
- Version control → Store `main.tf` in GitHub (not secrets!)

## Backend (No Terraform)

For Render backend, you manually:
1. Go to https://dashboard.render.com
2. Create Web Service
3. Connect GitHub repo
4. Set environment variables
5. Deploy

See `WEBSITE/Sunpost/backend/RENDER_DEPLOYMENT.md` for detailed steps.

## Summary

| Tool | What It Does | Your Setup |
|------|------------|-----------|
| **Terraform** | Automates infrastructure | Frontend (Vercel) ✅ |
| **render.yaml** | Configuration file | Backend (Render) ✅ |
| **GitHub** | Version control + auto-deploy trigger | Both 🔗 |

## One More Thing

Think of Terraform like writing a **shopping list** instead of going to the store yourself:

- You write: "I want 1 Vercel project with these settings"
- Terraform reads it: "I'll do that for you"
- Terraform builds it: Creates project, sets variables, connects GitHub
- You get: Working frontend automatically

That's it! 🎉
