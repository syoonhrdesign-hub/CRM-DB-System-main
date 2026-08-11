@echo off
chcp 65001 > nul
title 교육사업 CRM 서버

REM ===================================================================
REM  CRM 서버를 실행합니다.
REM
REM  이 창을 닫으면 서버가 꺼져 아무도 접속할 수 없습니다.
REM  최소화해 두거나, 작업 스케줄러에 등록해 자동으로 실행되게 하세요.
REM  (등록 방법은 README 의 "PC 를 켜면 자동으로 실행되게 하기" 참고)
REM ===================================================================

cd /d "%~dp0..\.."

if not exist ".env" (
  echo.
  echo   [오류] .env 파일이 없습니다.
  echo   README 를 보고 .env 를 먼저 만들어 주세요.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo.
  echo   [오류] node_modules 폴더가 없습니다.
  echo   먼저 명령 프롬프트에서 npm ci 를 실행해 주세요.
  echo.
  pause
  exit /b 1
)

if not exist ".next" (
  echo.
  echo   [오류] 빌드 결과가 없습니다.
  echo   먼저 명령 프롬프트에서 npm run build 를 실행해 주세요.
  echo.
  pause
  exit /b 1
)

REM 접속 주소를 안내하기 위해 이 PC 의 IP 를 찾는다
echo.
echo  ============================================================
echo   교육사업 CRM 서버
echo  ============================================================
echo.
echo   이 PC 에서는:  http://localhost:3000
echo.
echo   다른 PC 에서는 아래 주소 중 192.168 또는 10. 으로 시작하는 것:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do echo      http://%%a:3000
echo.
echo   창을 닫으면 서버가 꺼집니다. 최소화해 두세요.
echo  ============================================================
echo.

REM 서버가 예기치 않게 멈추면 5초 뒤 다시 띄운다.
:loop
call npm run start
echo.
echo   [알림] 서버가 멈췄습니다. 5초 후 다시 시작합니다.
echo          완전히 끄려면 이 창을 닫으세요.
echo.
timeout /t 5 /nobreak > nul
goto loop
