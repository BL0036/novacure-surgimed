@echo off
REM ============================================================
REM  gitpush.bat
REM  Commits and pushes any changed files in this folder to
REM  GitHub. Vercel auto-deploys whenever main is updated.
REM
REM  HOW TO USE:
REM   1. Put this file inside C:\Users\Admin\Desktop\novacure-surgimed
REM   2. Double-click it whenever you've changed files and want
REM      to push them live.
REM   3. A window will pop up, show progress, then pause at the
REM      end so you can read the result before it closes.
REM ============================================================

cd /d "%~dp0"

echo.
echo === Checking for changes ===
git status

echo.
echo === Staging all changes ===
git add .

echo.
set /p COMMITMSG="Enter a short message describing what changed: "
if "%COMMITMSG%"=="" set COMMITMSG=Update

echo.
echo === Committing ===
git commit -m "%COMMITMSG%"

echo.
echo === Pulling any remote changes first ===
git pull origin main --no-edit

echo.
echo === Pushing to GitHub (this triggers a Vercel deploy) ===
git push origin main

echo.
echo ============================================================
echo  Done. Check https://github.com/BL0036/novacure-surgimed
echo  and your Vercel dashboard to confirm the new deploy started.
echo ============================================================
pause
