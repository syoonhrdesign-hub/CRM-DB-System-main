@echo off
rem =====================================================================
rem  HRD 트렌드 자동 수집
rem
rem  작업 스케줄러에 "매일 오전 8시" 로 등록해 두면 출근했을 때
rem  간밤의 기사가 모여 있습니다.
rem
rem  필요한 것:
rem   - CRM 서버가 켜져 있어야 합니다 (start-crm.bat)
rem   - .env 에 TRENDS_CRON_TOKEN 이 있어야 합니다
rem =====================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0..\.."

rem .env 에서 TRENDS_CRON_TOKEN 을 읽는다
set "TOKEN="
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    if "%%a"=="TRENDS_CRON_TOKEN" set "TOKEN=%%b"
)
rem 따옴표 제거
set "TOKEN=%TOKEN:"=%"

if "%TOKEN%"=="" (
    echo [오류] .env 에 TRENDS_CRON_TOKEN 이 없습니다.
    echo        .env.example 의 4번 항목을 참고해 추가해 주세요.
    exit /b 1
)

curl -s -X POST "http://localhost:3000/api/trends/collect" -H "x-cron-token: %TOKEN%" -o "%TEMP%\trends-collect.json" -w "HTTP %%{http_code}"
echo.
type "%TEMP%\trends-collect.json"
echo.
exit /b 0
