@echo off
chcp 65001 >nul
title Enviando Planer Fibrasa para o GitHub
cd /d "%~dp0"
set PATH=%PATH%;%LOCALAPPDATA%\Programs\Git\cmd;%PROGRAMFILES%\Git\cmd

echo =================================================================
echo        ENVIANDO PLANER FIBRASA PARA O GITHUB
echo =================================================================
echo.
echo Repositório: https://github.com/manutencaofibrasa/planer-fibrasa.git
echo.
echo Se o navegador abrir pedindo autorização do GitHub, clique em "Authorize".
echo.

git push -u origin main

echo.
echo =================================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCESSO] Código enviado com sucesso para o GitHub!
) else (
    echo [ATENÇÃO] Ocorreu uma pendência de autenticação acima.
)
echo =================================================================
echo.
pause
