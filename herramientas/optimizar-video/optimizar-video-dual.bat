@echo off
setlocal EnableDelayedExpansion
title Optimizador de video dual - HD 1080p + ligero 720p

rem ============================================================
rem  Arrastra uno o varios videos sobre este archivo.
rem  Crea DOS archivos junto a cada original:
rem     "<nombre>-1080p.mp4"  -> HD para escritorio (nitidez)
rem     "<nombre>-720p.mp4"   -> ligero para movil
rem  Ambos con keyframe en cada fotograma (scrub fluido).
rem ============================================================

set "SCRIPT_DIR=%~dp0"
set "FFMPEG_DIR=%SCRIPT_DIR%ffmpeg"
set "FFMPEG_EXE=%FFMPEG_DIR%\bin\ffmpeg.exe"
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
    echo  Se generaran "<nombre>-1080p.mp4" y "<nombre>-720p.mp4"
    echo  junto al original.
    echo.
    pause
    exit /b 0
)

:process
if "%~1"=="" goto :done
set "ENTRADA=%~1"
set "SALIDA_HD=%~dpn1-1080p.mp4"
set "SALIDA_LIG=%~dpn1-720p.mp4"
echo.
echo  Procesando: %~nx1  (HD + ligero en una sola pasada)
"%FFMPEG_EXE%" -y -v error -stats -i "%ENTRADA%" -filter_complex "[0:v]split=2[vhd][vsmall];[vsmall]scale=w='min(1280,iw)':h=-2[vsmall2]" -map "[vhd]" -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf %CRF% -preset slow -g 1 -keyint_min 1 -sc_threshold 0 -movflags +faststart "%SALIDA_HD%" -map "[vsmall2]" -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf %CRF% -preset slow -g 1 -keyint_min 1 -sc_threshold 0 -movflags +faststart "%SALIDA_LIG%"
if errorlevel 1 (
    echo  ERROR al procesar %~nx1. Se omite el archivo.
) else (
    echo  Listo: %~nx1-1080p.mp4  y  %~nx1-720p.mp4
)
shift
goto :process

:done
echo.
echo  Proceso finalizado.
pause
