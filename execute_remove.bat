@echo off
REM This script removes all .md files except README.md and pushes changes to GitHub

cd /d "E:\Jac Hackathon\truthforge-ai"

echo.
echo ============================================================
echo  Removing all .md files (except README.md) from repository
echo ============================================================
echo.

REM Create list of files to delete
setlocal enabledelayedexpansion

set count=0

REM Delete .md files in root
for %%f in (*.md) do (
    if /i not "%%f"=="README.md" (
        echo Deleting: %%f
        del /f /q "%%f" 2>nul
        set /a count=!count!+1
    )
)

REM Delete .md files in src
if exist src (
    cd src
    for %%f in (*.md) do (
        echo Deleting: src\%%f
        del /f /q "%%f" 2>nul
        set /a count=!count!+1
    )
    cd ..
)

echo.
echo Deleted !count! files
echo.
echo Staging deletions with git...
git add -A

echo.
echo Committing changes...
git commit -m "Remove all documentation files - keep source code only" -m "Removed !count! .md files from repository"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ============================================================
echo  COMPLETE! All .md files removed from GitHub repository
echo ============================================================
echo.
pause
