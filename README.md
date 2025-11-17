# aventra_project_swe

swe course semester project for the yea

This guide explains how our team will use Git and GitHub to collaborate on Aventra.
Following these steps will keep our project organized and prevent us from overwriting each other’s work.

🔹 Branch Strategy

main → always stable, production-ready code.

dev → shared development branch. All features are merged here first.

feature/xxx → each new feature or task gets its own branch.

Example: feature/login-signup, feature/ai-itinerary-creator

👉 Only merge into main when dev has been tested and stable.

🔹 Workflow Steps

1. Clone the Repo (first time only)
   git clone <repo-url>
   cd aventra_project_swe

2. Create a New Branch

Always branch off of dev:

git checkout dev
git pull origin dev # make sure you have the latest changes
git checkout -b feature/your-feature-name

3. Work & Commit

Make changes locally, then save progress with commits:

git add .
git commit -m "Add login form UI"

4. Push Your Branch

Send your branch to GitHub:

git push origin feature/your-feature-name

5. Open a Pull Request (PR)

On GitHub, open a PR from your branch → dev.

Add teammates as reviewers.

After approval, merge into dev.

6. Sync Regularly

To avoid conflicts, keep your branch updated:

git checkout dev
git pull origin dev
git checkout feature/your-feature-name
git merge dev

🔹 Branch Naming Conventions

Features: feature/login-signup, feature/interactive-map

Bug fixes: bugfix/login-error

Documentation: docs/readme-update

Tests: test/authentication

🔹 Best Practices

✅ Commit often (small commits are better).
✅ Write meaningful commit messages (e.g., "Add map markers for events").
✅ Never push directly to main.
✅ Use PRs for merging (so code can be reviewed).
✅ Pull from dev frequently to stay updated.

💡 Quick Example:
If you’re working on Notifications:

git checkout dev
git pull origin dev
git checkout -b feature/notifications

# make changes, commit, push

git push origin feature/notifications

# open PR → dev
