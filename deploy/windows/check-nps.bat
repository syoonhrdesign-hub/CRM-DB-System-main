@echo off
chcp 65001 > nul
title 국민연금 키 확인
cd /d "%~dp0..\.."

echo ===============================================
echo  국민연금 API 키 확인
echo ===============================================
echo.

set NPSKEY=
for /f "tokens=2 delims==" %%K in ('findstr /b "NPS_API_KEY=" .env') do set NPSKEY=%%K
set NPSKEY=%NPSKEY:"=%

if "%NPSKEY%"=="" (
  echo [X] .env 에 NPS_API_KEY 가 없습니다.
  echo     data.go.kr 에서 발급받은 키를 .env 에 넣어 주세요.
  goto END
)

echo 키를 찾았습니다. 국민연금 서버에 물어봅니다...
echo.

curl.exe -s "https://apis.data.go.kr/B552015/NpsBplcInfoInqireService/getBassInfoSearch?serviceKey=%NPSKEY%&pageNo=1&numOfRows=3"

echo.
echo.
echo ===============================================
echo  위 내용을 그대로 캡쳐해서 보내 주세요.
echo.
echo  - resultCode 00 / NORMAL SERVICE  ==^> 키 정상
echo  - SERVICE_KEY_IS_NOT_REGISTERED   ==^> 활용신청 승인 대기 또는 다른 API 키
echo  - SERVICE_ACCESS_DENIED           ==^> 승인 안 됨
echo ===============================================

:END
echo.
pause
