# 국민연금 API 확인 — 주소 3가지를 차례로 호출해 어느 것이 살아 있는지 본다.
# 배치(.bat)는 한글이 섞이면 cmd 파서가 줄을 어긋나게 읽는 일이 있어 PowerShell 로 둔다.

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$envFile = Join-Path $repo ".env"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " 국민연금 API 확인" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $envFile)) {
  Write-Host "[X] .env 파일을 찾지 못했습니다: $envFile" -ForegroundColor Red
  return
}

$line = Get-Content $envFile | Where-Object { $_ -match '^\s*NPS_API_KEY\s*=' } | Select-Object -First 1
if (-not $line) {
  Write-Host "[X] .env 에 NPS_API_KEY 가 없습니다." -ForegroundColor Red
  return
}

$key = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")
if (-not $key) {
  Write-Host "[X] NPS_API_KEY 값이 비어 있습니다." -ForegroundColor Red
  return
}
Write-Host ("키를 찾았습니다 (길이 {0}자). 주소 3가지를 확인합니다..." -f $key.Length)
Write-Host ""

function Get-Body([string]$url) {
  try {
    return (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20).Content
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      return $reader.ReadToEnd()
    }
    return "REQUEST_FAILED: " + $_.Exception.Message
  }
}

$root = "https://apis.data.go.kr/B552015"
$targets = @(
  @{ 이름 = "[1] V2 주소 (신형)";            경로 = "NpsBplcInfoInqireServiceV2/getBassInfoSearchV2" },
  @{ 이름 = "[2] V2 주소 (조회명은 옛 이름)"; 경로 = "NpsBplcInfoInqireServiceV2/getBassInfoSearch"   },
  @{ 이름 = "[3] 옛 주소";                   경로 = "NpsBplcInfoInqireService/getBassInfoSearch"     }
)

$살아있는주소 = $null

foreach ($t in $targets) {
  Write-Host $t.이름 -ForegroundColor Yellow
  $url = "$root/$($t.경로)?serviceKey=$key&pageNo=1&numOfRows=3"
  $body = Get-Body $url

  if ($body -match "NORMAL SERVICE" -or $body -match "<resultCode>0*0</resultCode>") {
    $총건수 = if ($body -match "<totalCount>(\d+)</totalCount>") { $matches[1] } else { "?" }
    $첫사업장 = if ($body -match "<wkplNm>([^<]+)</wkplNm>") { $matches[1] } else { "(목록 없음)" }
    Write-Host "    => 정상. 전체 $총건수 건, 첫 사업장: $첫사업장" -ForegroundColor Green
    if (-not $살아있는주소) { $살아있는주소 = $t.이름 }
  }
  elseif ($body -match "NO_OPENAPI_SERVICE") {
    Write-Host "    => 폐기된 주소" -ForegroundColor DarkGray
  }
  elseif ($body -match "SERVICE_KEY_IS_NOT_REGISTERED") {
    Write-Host "    => 키가 이 API 에 등록되지 않음 (활용신청 승인 대기)" -ForegroundColor Red
  }
  elseif ($body -match "SERVICE_ACCESS_DENIED") {
    Write-Host "    => 접근 거부 (승인 안 됨)" -ForegroundColor Red
  }
  elseif ($body -match "LIMITED_NUMBER_OF_SERVICE_REQUESTS") {
    Write-Host "    => 일일 호출 한도 초과" -ForegroundColor Red
  }
  else {
    Write-Host "    => 알 수 없는 응답:" -ForegroundColor Red
    $한줄 = ($body -replace "\s+", " ").Trim()
    if ($한줄.Length -gt 300) { $한줄 = $한줄.Substring(0, 300) + " ..." }
    Write-Host "       $한줄"
  }
  Write-Host ""
}

Write-Host "===============================================" -ForegroundColor Cyan
if ($살아있는주소) {
  Write-Host " 결론: $살아있는주소 가 살아 있습니다. API 는 정상입니다." -ForegroundColor Green
  Write-Host ""
  Write-Host " 회사를 못 찾는다면 이름 문제입니다 — 국민연금에는"
  Write-Host " 한글 정식 상호로 등록돼 있어 영문 이름은 잡히지 않습니다."
} else {
  Write-Host " 결론: 세 주소 모두 쓸 수 없습니다." -ForegroundColor Red
  Write-Host " 위 메시지를 그대로 캡쳐해서 보내 주세요."
}
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
