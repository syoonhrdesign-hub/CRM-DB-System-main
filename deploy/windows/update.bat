@echo off
chcp 65001 > nul
title CRM 업데이트

REM ===================================================================
REM  최신 코드를 받아 다시 빌드합니다.
REM
REM  ※ "관리자 권한으로 실행" 으로 열어 주세요.
REM    (이 파일 오른쪽 클릭 → 관리자 권한으로 실행)
REM
REM  주의: git pull 이 이 파일 자신을 바꾸면, cmd 가 바뀐 파일의 엉뚱한
REM  위치를 이어 읽어 실행이 깨진다. 그래서 임시 폴더로 자신을 복사한 뒤
REM  그 사본에서 실제 작업을 한다.
REM ===================================================================

if "%~1"=="__COPY__" goto RUN

set "SELFCOPY=%TEMP%\crm-update.bat"
copy /y "%~f0" "%SELFCOPY%" >nul 2>&1
if errorlevel 1 (
  echo.
  echo   [실패] 임시 폴더에 복사하지 못했습니다: %TEMP%
  echo.
  pause
  exit /b 1
)
call "%SELFCOPY%" __COPY__ "%~dp0"
exit /b %errorlevel%


:RUN
REM 원본 위치(두 번째 인자)를 기준으로 프로젝트 폴더를 찾는다
set "HERE=%~2"
if "%HERE%"=="" set "HERE=%~dp0"
cd /d "%HERE%..\.."

echo.
echo   작업 폴더: %CD%
echo.

net session >nul 2>&1
if errorlevel 1 goto NOTADMIN
goto ADMINOK

:NOTADMIN
echo  ============================================================
echo   [주의] 관리자 권한이 아닙니다.
echo   이대로 진행하면 빌드가 EPERM 오류로 멈출 수 있습니다.
echo   창을 닫고 update.bat 을 오른쪽 클릭해서
echo   "관리자 권한으로 실행" 으로 다시 열어 주세요.
echo  ============================================================
echo.
set /p ADMGO="   그래도 계속하시겠습니까? (Y/N): "
if /i not "%ADMGO%"=="Y" exit /b 0

:ADMINOK
echo   업데이트 전에 백업을 권합니다 (backup.bat).
echo.
set /p GO="   계속하시겠습니까? (Y/N): "
if /i not "%GO%"=="Y" exit /b 0

echo.
echo   [1/5] 서버 끄는 중...
REM 서버가 켜져 있으면 빌드가 파일을 못 바꿔 EPERM 으로 실패한다.
REM 이미 꺼져 있으면 아무 일도 일어나지 않는다.
taskkill /f /im node.exe >nul 2>&1
ping -n 3 127.0.0.1 >nul

echo   [2/5] 최신 코드 받는 중...
call git pull
if errorlevel 1 goto FAILED

echo.
echo   [3/5] 패키지 확인 중... (몇 분 걸릴 수 있습니다)
call npm ci
if errorlevel 1 goto FAILED

echo.
echo   [4/5] 데이터베이스 반영 중...
call npm run db:deploy
if errorlevel 1 goto FAILED

echo.
echo   [5/5] 빌드 중... (몇 분 걸립니다)
REM 잠긴 파일 이름 바꾸기(EPERM)를 피하려고 통째로 지운다. 빌드가 새로 만든다.
if exist "node_modules\.prisma" rmdir /s /q "node_modules\.prisma"
call npm run build
if errorlevel 1 goto FAILED

echo.
echo  ============================================================
echo   업데이트 완료
echo   start-crm.bat 으로 서버를 다시 켜 주세요.
echo  ============================================================
echo.
pause
exit /b 0

:FAILED
echo.
echo  ============================================================
echo   [실패] 위 오류 메시지를 확인해 주세요.
echo   "EPERM" 이면 관리자 권한으로 다시 실행해 주세요.
echo   서버는 start-crm.bat 으로 이전 버전 그대로 켤 수 있습니다.
echo  ============================================================
echo.
pause
exit /b 1
