@echo off
chcp 65001 > nul
title CRM 데이터 백업

REM ===================================================================
REM  데이터베이스를 파일 하나로 백업합니다.
REM
REM  ★ 중요 ★
REM  BACKUP_DIR 을 반드시 "이 PC 가 아닌 곳"으로 지정하세요.
REM  같은 PC 에 백업하면 그 PC 가 고장날 때 백업도 같이 사라집니다.
REM
REM  좋은 예: 구글 드라이브 동기화 폴더, 네트워크 드라이브(Z:), USB
REM ===================================================================

REM ↓↓↓ 여기를 본인 환경에 맞게 바꾸세요 ↓↓↓
set "BACKUP_DIR=C:\Users\%USERNAME%\Google Drive\CRM백업"
set "PGBIN=C:\Program Files\PostgreSQL\17\bin"
set "PGUSER=crm"
set "PGDATABASE=crm"
set "PGPORT=5432"
REM ↑↑↑ 여기까지 ↑↑↑

REM 보관할 백업 개수 (이보다 오래된 것은 자동 삭제)
set KEEP=30

cd /d "%~dp0..\.."

if not exist "%PGBIN%\pg_dump.exe" (
  echo.
  echo   [오류] pg_dump 를 찾을 수 없습니다:
  echo          %PGBIN%\pg_dump.exe
  echo.
  echo   PostgreSQL 설치 폴더가 다를 수 있습니다.
  echo   이 파일을 메모장으로 열어 PGBIN 값을 고쳐 주세요.
  echo.
  pause
  exit /b 1
)

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_DIR%" (
  echo.
  echo   [오류] 백업 폴더를 만들 수 없습니다: %BACKUP_DIR%
  echo   이 파일을 메모장으로 열어 BACKUP_DIR 값을 고쳐 주세요.
  echo.
  pause
  exit /b 1
)

REM 파일명에 쓸 날짜시각 (지역 설정과 무관하게 안전한 방식)
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HHmm"') do set STAMP=%%i

set "OUTFILE=%BACKUP_DIR%\crm_%STAMP%.dump"

echo.
echo   백업 중...  %OUTFILE%
echo.

REM .env 의 비밀번호를 쓰려면 아래 줄의 주석을 풀고 값을 넣으세요.
REM set PGPASSWORD=여기에비밀번호

"%PGBIN%\pg_dump.exe" -h localhost -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -F c -f "%OUTFILE%"

if errorlevel 1 (
  echo.
  echo   [실패] 백업하지 못했습니다.
  echo   비밀번호를 물어봤다면, 이 파일의 PGPASSWORD 줄을 설정해 주세요.
  echo.
  pause
  exit /b 1
)

echo   [완료] 백업했습니다.
for %%f in ("%OUTFILE%") do echo          크기: %%~zf 바이트

REM 오래된 백업 정리 — 최근 %KEEP% 개만 남긴다
powershell -NoProfile -Command ^
  "Get-ChildItem -Path '%BACKUP_DIR%' -Filter 'crm_*.dump' | Sort-Object LastWriteTime -Descending | Select-Object -Skip %KEEP% | Remove-Item -Force"

echo   오래된 백업을 정리했습니다 (최근 %KEEP%개 보관).
echo.

REM 작업 스케줄러가 실행할 때는 창이 멈추지 않게 한다.
REM 사람이 직접 더블클릭한 경우에만 결과를 볼 수 있게 잠시 멈춘다.
if "%1"=="/auto" exit /b 0
pause
