import os
import subprocess
import glob

os.chdir("E:\\Jac Hackathon\\truthforge-ai")

# List of .md files to keep
keep_files = {"README.md"}

# Delete .md files in root
print("Deleting .md files in root directory...")
for file in glob.glob("*.md"):
    if file not in keep_files:
        try:
            os.remove(file)
            print(f"✓ Deleted: {file}")
        except Exception as e:
            print(f"✗ Failed to delete {file}: {e}")

# Delete .md files in src
print("\nDeleting .md files in src directory...")
if os.path.exists("src"):
    for file in glob.glob("src\\*.md"):
        try:
            os.remove(file)
            print(f"✓ Deleted: {file}")
        except Exception as e:
            print(f"✗ Failed to delete {file}: {e}")

# Git operations
print("\nStaging changes...")
subprocess.run(["git", "add", "-A"], check=True)

print("Committing changes...")
subprocess.run(["git", "commit", "-m", "Remove all documentation files - keep source code only"], check=True)

print("Pushing to GitHub...")
subprocess.run(["git", "push"], check=True)

print("\n✓ COMPLETE! All .md files removed from repository")
