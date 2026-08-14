@echo off
title LocalSite Optimizer
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\Start-LocalSiteOptimizer.ps1"
if errorlevel 1 pause
