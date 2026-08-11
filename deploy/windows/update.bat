@echo off
chcp 65001 > nul
title CRM 업데이트

REM ===================================================================
REM  최신 코드를 받아 다시 빌드합니다.
REM
REM  실행 전에 CRM 서버 창(start-crm.bat)을 닫아 주세요.
REM  업데이트가 끝나면 start-crm.bat 로 다시 켜면 됩니다.
REM ===================================================================

cd /d "%~dp0..\.."

echo.
echo   업데이트를 시작하기 전에 백업을 먼저 하는 것을 권합니다.
echo   (backup.bat 실행)
echo.
set /p GO="   계속하시겠습니까? (Y/N): "
if /i not "%GO%"=="Y" (
  echo   취소했습니다.
  pause
  exit /b 0
)

echo.
echo   [1/4] 최신 코드 받는 중...
call git pull
if errorlevel 1 goto failed

echo.
echo   [2/4] 필요한 패키지 설치 중... (몇 분 걸릴 수 있습니다)
call npm ci
if errorlevel 1 goto failed

echo.
echo   [3/4] 데이터베이스 구조 반영 중...
call npm run db:deploy
if errorlevel 1 goto failed

echo.
echo   [4/4] 빌드 중... (몇 분 걸릴 수 있습니다)
call npm run build
if errorlevel 1 goto failed

echo.
echo  ============================================================
echo   업데이트 완료
echo   start-crm.bat 로 서버를 다시 켜 주세요.
echo  ============================================================
echo.
pause
exit /b 0

:failed
echo.
echo  ============================================================
echo   [실패] 위에 나온 오류 메시지를 확인해 주세요.
echo   서버는 이전 버전 그대로 켤 수 있습니다.
echo  ============================================================
echo.
pause
exit /b 1
