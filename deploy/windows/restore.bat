@echo off
chcp 65001 > nul
title CRM 데이터 복원

REM ===================================================================
REM  백업 파일에서 데이터를 되돌립니다.
REM
REM  ★ 경고 ★
REM  지금 들어 있는 데이터를 모두 지우고 백업 시점으로 되돌립니다.
REM  백업 이후에 입력한 내용은 사라집니다.
REM
REM  사용법: 백업 파일(.dump)을 이 파일 위로 끌어다 놓으세요.
REM ===================================================================

REM PostgreSQL 설치 경로 (backup.bat 와 같은 값으로 맞추세요)
set "PGBIN=C:\Program Files\PostgreSQL\17\bin"
set "PGUSER=crm"
set "PGDATABASE=crm"
set "PGPORT=5432"

set "DUMPFILE=%~1"

if "%DUMPFILE%"=="" (
  echo.
  echo   복원할 백업 파일을 지정해 주세요.
  echo.
  echo   방법 1) 백업 파일(.dump)을 이 restore.bat 아이콘 위로 끌어다 놓기
  echo   방법 2) 명령 프롬프트에서:  restore.bat "C:\경로\crm_2026-08-11_0300.dump"
  echo.
  pause
  exit /b 1
)

if not exist "%DUMPFILE%" (
  echo.
  echo   [오류] 파일을 찾을 수 없습니다: %DUMPFILE%
  echo.
  pause
  exit /b 1
)

echo.
echo  ============================================================
echo   경고: 현재 데이터를 모두 지우고 아래 백업으로 되돌립니다.
echo  ============================================================
echo.
echo   복원할 파일: %DUMPFILE%
echo.
echo   되돌리기 전에 CRM 서버 창(start-crm.bat)을 먼저 닫아 주세요.
echo.
REM 확인 문구는 영문으로 받는다. cmd 에서 한글 입력 비교는 환경에 따라 실패한다.
set /p CONFIRM="   정말 진행하려면 RESTORE 라고 입력하세요: "

if not "%CONFIRM%"=="RESTORE" (
  echo.
  echo   취소했습니다.
  echo.
  pause
  exit /b 0
)

REM 비밀번호를 물어보면 아래 줄의 주석을 풀고 값을 넣으세요.
REM set PGPASSWORD=여기에비밀번호

echo.
echo   복원 중...
echo.

REM --clean 은 기존 테이블을 지우고 다시 만든다.
"%PGBIN%\pg_restore.exe" -h localhost -p %PGPORT% -U %PGUSER% -d %PGDATABASE% --clean --if-exists "%DUMPFILE%"

if errorlevel 1 (
  echo.
  echo   [주의] 복원 중 메시지가 있었습니다.
  echo   위 내용을 확인해 주세요. 대부분은 "없는 것을 지우려 했다"는
  echo   무해한 알림이지만, 데이터가 제대로 들어왔는지 확인이 필요합니다.
  echo.
) else (
  echo.
  echo   [완료] 복원했습니다.
  echo.
)

echo   이제 start-crm.bat 로 서버를 다시 켜고,
echo   로그인해서 데이터가 제대로 들어왔는지 확인해 주세요.
echo.
pause
