@echo off
title LocalSite Optimizer — Install
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\Install-LocalSiteOptimizer.ps1"
pause
