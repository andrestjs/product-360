@echo off
setlocal EnableDelayedExpansion
title Optimizador de video para web - Ligero 720p

rem ============================================================
rem  Arrastra uno o varios videos sobre este archivo.
rem  Crea junto a cada uno un "<nombre>-optimizado.mp4" con
rem  keyframe en cada fotograma (scrub fluido con scroll o drag).
rem  Calidad: 720p ligero (ancho maximo 1280 px). Menos peso, misma fluidez.
rem ============================================================

set "SCRIPT_DIR=%~dp0"
set "FFMPEG_DIR=%SCRIPT_DIR%ffmpeg"
set "FFMPEG_EXE=%FFMPEG_DIR%\bin\ffmpeg.exe"
set "SCALE=1280:-2"
set "CRF=23"

rem --- Buscar ffmpeg: portable primero, luego el del sistema ---
if exist "%FFMPEG_EXE%" goto :run
where ffmpeg >nul 2>nul
if not errorlevel 1 (
    set "FFMPEG_EXE=ffmpeg"
    goto :run
)

rem --- Primera vez: descargar ffmpeg portatil junto al script ---
echo.
echo  Primera vez que se usa esta herramienta.
echo  Se descargara ffmpeg portatil junto a este archivo (~90 MB).
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%descargar-ffmpeg.ps1" -Destino "%FFMPEG_DIR%"
if not exist "%FFMPEG_EXE%" (
    echo.
    echo  ERROR: no se pudo descargar ffmpeg. Comprueba tu conexion a internet
    echo  y vuelve a arrastrar el video sobre este archivo.
    echo.
    pause
    exit /b 1
)

:run
if "%~1"=="" (
    echo.
    echo  USO: arrastra uno o varios videos sobre este archivo.
    echo  El resultado sera "<nombre>-optimizado.mp4" junto al original.
    echo.
    pause
    exit /b 0
)

:process
if "%~1"=="" goto :done
set "ENTRADA=%~1"
set "SALIDA=%~dpn1-optimizado.mp4"
echo.
echo  Procesando: %~nx1
"%FFMPEG_EXE%" -y -v error -stats -i "%ENTRADA%" -an -c:v libx264 -profile:v high -pix_fmt yuv420p -vf "scale=%SCALE%" -g 1 -keyint_min 1 -sc_threshold 0 -crf %CRF% -preset slow -movflags +faststart "%SALIDA%"
if errorlevel 1 (
    echo  ERROR al procesar %~nx1. Se omite el archivo.
) else (
    echo  Listo: %~nx1-optimizado.mp4
)
shift
goto :process

:done
echo.
echo  Proceso finalizado.
pause
