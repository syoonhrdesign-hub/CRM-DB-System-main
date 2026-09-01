@echo off
chcp 65001 > nul
title CRM 업데이트

REM ===================================================================
REM  최신 코드를 받아 다시 빌드합니다.
REM
REM  서버는 이 스크립트가 알아서 끕니다. 끝나면 start-crm.bat 로 켜세요.
REM
REM  ※ 반드시 "관리자 권한으로 실행" 하세요.
REM    (이 파일 오른쪽 클릭 → 관리자 권한으로 실행)
REM    권한이 없으면 빌드 중 파일 잠김(EPERM) 오류가 납니다.
REM ===================================================================

net session >nul 2>&1
if errorlevel 1 goto notadmin
goto adminok

:notadmin
echo.
echo  ============================================================
echo   [주의] 관리자 권한이 아닙니다.
echo.
echo   이대로 진행하면 빌드가 EPERM 오류로 멈출 수 있습니다.
echo   이 창을 닫고, update.bat 을 오른쪽 클릭해서
echo   "관리자 권한으로 실행" 으로 다시 열어 주세요.
echo  ============================================================
echo.
set /p ADMGO="   그래도 계속하시겠습니까? (Y/N): "
if /i not "%ADMGO%"=="Y" exit /b 0

:adminok

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
echo   [1/6] 서버 끄는 중...
REM 서버가 켜져 있으면 빌드가 파일을 못 바꿔 EPERM 으로 실패한다.
REM 이미 꺼져 있으면 "프로세스 없음" 이 뜨는데 정상이다.
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo   [2/6] 최신 코드 받는 중...
call git pull
if errorlevel 1 goto failed

echo.
echo   [3/6] 필요한 패키지 설치 중... (몇 분 걸릴 수 있습니다)
call npm ci
if errorlevel 1 goto failed

echo.
echo   [4/6] 데이터베이스 구조 반영 중...
call npm run db:deploy
if errorlevel 1 goto failed

echo.
echo   [5/6] 이전 빌드 찌꺼기 정리 중...
REM 백신 등이 이 파일을 잡고 있으면 이름 바꾸기가 막힌다.
REM 통째로 지우면 다음 단계에서 새로 만들어지므로 잠길 일이 없다.
if exist "node_modules\.prisma" rmdir /s /q "node_modules\.prisma"

echo.
echo   [6/6] 빌드 중... (몇 분 걸릴 수 있습니다)
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
echo.
echo   "EPERM" 이 보이면 관리자 권한으로 다시 실행해 주세요.
echo   서버는 start-crm.bat 로 이전 버전 그대로 켤 수 있습니다.
echo  ============================================================
echo.
pause
exit /b 1
