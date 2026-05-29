# Push to GitHub

## Setup (First Time Only)

1. Create a GitHub account at https://github.com
2. Install Git: https://git-scm.com
3. Create Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token"
   - Select `repo` scope
   - Copy the token

## Push Your Code

```bash
cd /home/xian-flores/new-project
git init
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git add .
git commit -m "Initial commit: SunPost"
```

Go to https://github.com/new and create a repository. Copy its URL, then:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

When prompted:
- Username: your GitHub username
- Password: your Personal Access Token

## Done!

Your code is now on GitHub at `https://github.com/yourusername/sunpost`

## Already Have a Repo?

If you already created the repository on GitHub:

```bash
cd /home/xian-flores/new-project
git init
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git add .
git commit -m "Initial commit: SunPost"
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

That's it! Your code is now pushed.

## Future Updates

```bash
git add .
git commit -m "Your message"
git push
```
