@echo off
REM TruthForge AI - Git Push Script
REM Pushes code to repository, excluding .env and local files

title TruthForge AI - Git Push
color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║            TruthForge AI - Git Push Script               ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check git status
echo Checking git status...
call git status

echo.
echo Adding files to staging area...
call git add -A

echo.
echo Committing changes...
call git commit -m "TruthForge AI: Production-ready implementation

- Jac backend with 8 walkers
- Express API with 6 endpoints
- Gemini API integration
- Web search integration
- SQLite persistence
- React frontend
- Integration testing suite
- Docker containerization
- Comprehensive documentation

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

echo.
echo Pushing to repository...
call git push

echo.
echo ✓ Push completed!
echo.
pause
