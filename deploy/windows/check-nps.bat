@echo off
chcp 65001 > nul
title 국민연금 API 확인
cd /d "%~dp0..\.."

echo ===============================================
echo  국민연금 API 확인
echo ===============================================
echo.

set NPSKEY=
for /f "tokens=2 delims==" %%K in ('findstr /b "NPS_API_KEY=" .env') do set NPSKEY=%%K
set NPSKEY=%NPSKEY:"=%

if "%NPSKEY%"=="" goto NOKEY

echo 키를 찾았습니다. 주소 3가지를 차례로 확인합니다...
echo.

set ROOT=https://apis.data.go.kr/B552015
set TAIL=pageNo=1^&numOfRows=3

echo -----------------------------------------------
echo  [1] V2 주소 (신형)
echo -----------------------------------------------
curl.exe -s "%ROOT%/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=%NPSKEY%&%TAIL%"
echo.
echo.

echo -----------------------------------------------
echo  [2] V2 주소 (조회명은 옛 이름)
echo -----------------------------------------------
curl.exe -s "%ROOT%/NpsBplcInfoInqireServiceV2/getBassInfoSearch?serviceKey=%NPSKEY%&%TAIL%"
echo.
echo.

echo -----------------------------------------------
echo  [3] 옛 주소
echo -----------------------------------------------
curl.exe -s "%ROOT%/NpsBplcInfoInqireService/getBassInfoSearch?serviceKey=%NPSKEY%&%TAIL%"
echo.
echo.

echo ===============================================
echo  읽는 법
echo.
echo   NORMAL SERVICE / resultCode 00  ==^> 이 주소가 살아 있음 (정상)
echo   NO_OPENAPI_SERVICE              ==^> 이 주소는 폐기됨
echo   SERVICE_KEY_IS_NOT_REGISTERED   ==^> 활용신청 승인 대기
echo   SERVICE_ACCESS_DENIED           ==^> 승인 안 됨
echo.
echo  위 [1][2][3] 결과를 그대로 캡쳐해서 보내 주세요.
echo  셋 다 폐기라고 나오면 data.go.kr 문서의 현재 주소가 필요합니다.
echo ===============================================
goto END

:NOKEY
echo [X] .env 에 NPS_API_KEY 가 없습니다.
echo     data.go.kr 에서 발급받은 키를 .env 에 넣어 주세요.

:END
echo.
pause
