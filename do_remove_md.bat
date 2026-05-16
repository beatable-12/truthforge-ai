@echo off
setlocal enabledelayedexpansion

cd /d "E:\Jac Hackathon\truthforge-ai"

echo Deleting .md files (keeping README.md)...

REM Delete all .md files in root except README.md
for %%f in (*.md) do (
    if /i not "%%f"=="README.md" (
        echo Deleting: %%f
        del /f /q "%%f"
    )
)

REM Delete .md files in src folder
if exist src (
    cd src
    for %%f in (*.md) do (
        echo Deleting src\%%f
        del /f /q "%%f"
    )
    cd ..
)

echo.
echo Staging changes...
git add -A

echo.
echo Committing...
git commit -m "Remove documentation - keep source code and README only"

echo.
echo Pushing to GitHub...
git push

echo.
echo DONE! All .md files removed from GitHub repository
echo.
