# Terraform for SunPost

This directory contains Infrastructure-as-Code (IaC) for deploying SunPost.

## What is Terraform?

**Terraform** is a tool that lets you describe your infrastructure (servers, databases, APIs) in code instead of clicking buttons in web dashboards. Think of it like a recipe—you write what you want, and Terraform builds it for you.

## How SunPost Terraform Works

```
Your Code (GitHub)
       ↓
Terraform (describes what to build)
       ↓
   ┌───┴────┐
   ↓        ↓
Vercel   Render
(Frontend) (Backend)
   ↓        ↓
HTML/CSS  Python API
```

### Frontend (Vercel) - With Terraform ✅

**What it does:**
- Reads your GitHub repository
- Automatically deploys to Vercel
- Sets environment variables
- Manages domains and settings

**Files:**
- `vercel/main.tf` - Configuration for Vercel
- `vercel/variables.tf` - Input parameters
- `vercel/outputs.tf` - Results (URLs, IDs)

**Command to deploy:**
```bash
cd terraform/vercel
terraform init
terraform apply
```

You'll need:
- `VERCEL_API_TOKEN` - Get from https://vercel.com/account/tokens
- `GITHUB_REPO` - Your repo like `yourusername/sunpost`

### Backend (Render) - Manual for Now ⚙️

**Why not Terraform?**
- Render doesn't have an official Terraform provider yet
- You deploy it using `render.yaml` file instead

**How to deploy:**
1. Push code to GitHub
2. Go to https://dashboard.render.com
3. Create new Web Service
4. Connect your GitHub repo
5. Set environment variables
6. Deploy

**Important:** the repository contains a top-level `render.yaml` with the Render service definition for the backend. It is aligned with `WEBSITE/Sunpost/backend/render.yaml` and includes the Python 3.12 runtime, `PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python`, and Render file secret support for `GOOGLE_APPLICATION_CREDENTIALS`.

See `WEBSITE/Sunpost/backend/RENDER_DEPLOYMENT.md` for detailed steps.

## Quick Start

### 1. Deploy Frontend with Terraform

```bash
cd terraform/vercel
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan    # See what will be created
terraform apply   # Build it!
```

### 2. Deploy Backend Manually

```bash
cd WEBSITE/Sunpost/backend
# Follow RENDER_DEPLOYMENT.md steps
```

## File Structure

```
terraform/
├── vercel/
│   ├── main.tf          # Vercel configuration
│   ├── variables.tf     # Input variables
│   └── outputs.tf       # Output values
└── render/
    └── main.tf          # Render documentation (no provider yet)
```

## Terraform Commands Explained

| Command | What it does |
|---------|------------|
| `terraform init` | Download Terraform plugins |
| `terraform plan` | Show what will be created |
| `terraform apply` | Build everything |
| `terraform destroy` | Delete everything |
| `terraform state` | Show current resources |

## Environment Variables

### For Frontend Deployment

Create `terraform/vercel/terraform.tfvars`:
```hcl
vercel_api_token = "your_vercel_token"
vercel_team_id   = "your_team_id"
github_repo      = "yourusername/sunpost"
api_url          = "https://sunpost-backend.onrender.com"
```

This Terraform configuration now sets `SUNPOST_BACKEND_URL` on the Vercel project, so the deployed frontend can be wired to your Render backend.

**Get values:**
- `vercel_api_token`: https://vercel.com/account/tokens
- `vercel_team_id`: Vercel dashboard → Settings → Team ID
- `github_repo`: Your GitHub repository path

### For Backend Deployment

Use Render dashboard and `render.yaml` (no Terraform needed yet).

## How It All Works Together

1. **You push code to GitHub**
   ```
   git push origin main
   ```

2. **Terraform builds Vercel frontend automatically**
   ```
   terraform apply
   ```

3. **You deploy Render backend via dashboard**
   - Render pulls code from GitHub
   - Builds and deploys using `render.yaml`

4. **Both are connected**
   - Frontend talks to backend at: `https://sunpost-backend.onrender.com`
   - Backend serves API to frontend at: `https://sunpost-frontend.vercel.app`

```
Browser
  ↓
Frontend (Vercel) ←→ Backend (Render)
https://sunpost-frontend.vercel.app ← → https://sunpost-backend.onrender.com
```

## Important Notes

- **Don't commit secrets**: Keep `terraform.tfvars` in `.gitignore`
- **State file**: `terraform.tfstate` tracks your resources (don't delete it)
- **Destroy carefully**: `terraform destroy` will delete everything
- **Backend changes**: Edit `render.yaml` in `WEBSITE/Sunpost/backend/`

## Troubleshooting

**"Invalid token"**
- Verify your Vercel API token is correct
- Generate a new one at https://vercel.com/account/tokens

**"Project already exists"**
- Terraform tracks resources in `terraform.tfstate`
- Either use different project name or import existing resource

**"terraform command not found"**
- Install Terraform: https://www.terraform.io/downloads

## Next Steps

1. ✅ Set up GitHub repository
2. 🚀 Deploy frontend with Terraform (this directory)
3. 🚀 Deploy backend with Render dashboard
4. ✅ Connect them together
5. 🎉 Your SunPost is live!

See `GITHUB_SETUP.md` and `WEBSITE/Sunpost/backend/RENDER_DEPLOYMENT.md` for detailed guides.
