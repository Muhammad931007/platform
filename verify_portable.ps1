[CmdletBinding()]
param(
  [string]$Root
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) {
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$rootPath = (Resolve-Path -LiteralPath $Root).Path
$nodePath = Join-Path $rootPath 'system\nodejs\node.exe'
$clientScript = Join-Path $rootPath 'Client\server.js'
$backendScript = Join-Path $rootPath 'Backend\server.js'
$dbPath = Join-Path $rootPath 'Backend\data\db.json'

foreach ($required in @($nodePath, $clientScript, $backendScript, $dbPath)) {
  if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
    throw "Missing required portable file: $required"
  }
}

$oldPassword = $env:LOCAL_ADMIN_PASSWORD
$env:LOCAL_ADMIN_PASSWORD = 'portable-healthcheck-only'
$client = $null
$backend = $null

function Wait-Http([string]$Uri) {
  for ($i = 0; $i -lt 40; $i++) {
    try {
      return Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 1
    } catch {
      Start-Sleep -Milliseconds 250
    }
  }
  throw "Timed out waiting for $Uri"
}

try {
  $client = Start-Process -FilePath $nodePath -ArgumentList @('"' + (Join-Path $rootPath 'Client\server.js') + '"') -WorkingDirectory $rootPath -WindowStyle Hidden -PassThru
  $backend = Start-Process -FilePath $nodePath -ArgumentList @('"' + (Join-Path $rootPath 'Backend\server.js') + '"') -WorkingDirectory $rootPath -WindowStyle Hidden -PassThru

  $clientHome = Wait-Http 'http://127.0.0.1:3000/'
  $backendHome = Wait-Http 'http://127.0.0.1:8080/'
  $clientLogin = (Invoke-WebRequest -Uri 'http://127.0.0.1:3000/myapi/login/do_login_v1' -Method Post -ContentType 'application/json' -Body '{"username":"testuser","password":"password123"}' -UseBasicParsing).Content | ConvertFrom-Json
  $clientInfo = (Invoke-WebRequest -Uri 'http://127.0.0.1:3000/myapi/infomation/index' -UseBasicParsing).Content | ConvertFrom-Json
  $uploadInfo = (Invoke-WebRequest -Uri 'http://127.0.0.1:3000/myapi/file_upload/check' -UseBasicParsing).Content | ConvertFrom-Json
  $expiredSession = (Invoke-WebRequest -Uri 'http://127.0.0.1:3000/myapi/My/getMyInfo' -UseBasicParsing).Content | ConvertFrom-Json
  $adminLogin = (Invoke-WebRequest -Uri 'http://127.0.0.1:8080/admin/login/index.html' -Method Post -ContentType 'application/json' -Body '{"username":"admin","password":"portable-healthcheck-only"}' -UseBasicParsing).Content | ConvertFrom-Json
  $adminPage = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/admin/users/index.html' -UseBasicParsing
  $adminAction = (Invoke-WebRequest -Uri 'http://127.0.0.1:8080/admin/deal/deposit_success.html' -Method Post -ContentType 'application/json' -Body '{"id":"REC-20260826-001"}' -UseBasicParsing).Content | ConvertFrom-Json
  $modalPage = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/admin/users/add_users.html' -UseBasicParsing
  $actionRoutes = @(
    '/admin/auth/forbid.html', '/admin/auth/remove.html', '/admin/deal/deposit_success.html',
    '/admin/deal/deposit_fail.html', '/admin/deal/do_deposit2.html', '/admin/deal/do_deposit3.html',
    '/admin/menu/forbid.html', '/admin/menu/remove.html', '/admin/menu/resume.html',
    '/admin/oplog/remove.html', '/admin/plots/cancel.html', '/admin/user/forbid.html',
    '/admin/user/remove.html', '/admin/users/delete_login_history.html', '/admin/users/level_forbid.html',
    '/admin/users/level_resume.html', '/admin/users/remove_cs.html', '/admin/users/reset_deal_cnt.html',
    '/admin/users/reset_deal_reward.html', '/admin/users/revert_reset_deal_cnt.html',
    '/admin/users/show_gift_modal.html', '/admin/users/edit_cs_status/2/20.html',
    '/admin/users/edit_cs_status/2/23.html', '/admin/users/edit_cs_status/2/24.html',
    '/admin/users/edit_cs_status/2/25.html', '/admin/users/edit_users_status/2/4182.html',
    '/admin/users/edit_users_status/2/4183.html', '/admin/users/edit_users_status/2/4184.html',
    '/admin/users/edit_users_status/2/4185.html', '/admin/users/edit_users_status/2/4186.html',
    '/admin/users/edit_users_status/2/4187.html', '/admin/users/edit_users_status/2/4188.html',
    '/admin/users/edit_users_status/2/4189.html', '/admin/users/edit_users_status/2/4190.html',
    '/admin/users/edit_users_status/2/4191.html'
  )
  $actionResults = foreach ($route in $actionRoutes) {
    try {
      $result = (Invoke-WebRequest -Uri ('http://127.0.0.1:8080' + $route) -Method Post -ContentType 'application/json' -Body '{"id":"1","status":"2"}' -UseBasicParsing).Content | ConvertFrom-Json
      [bool]($result.code -eq 1)
    } catch { $false }
  }
  $capturedFiles = Get-ChildItem -Path (Join-Path $rootPath 'Backend\admin') -Recurse -File -Filter '*.html'
  $modalRoutes = foreach ($file in $capturedFiles) {
    $html = Get-Content -LiteralPath $file.FullName -Raw
    [regex]::Matches($html, 'data-(?:modal|open)\s*=\s*["''](/admin/[^"''#]+)["'']') | ForEach-Object { $_.Groups[1].Value }
  }
  $modalRoutes = $modalRoutes | ForEach-Object { ($_ -split '\?')[0] } | Sort-Object -Unique
  $modalResults = foreach ($route in $modalRoutes) {
    try { (Invoke-WebRequest -Uri ('http://127.0.0.1:8080' + $route) -UseBasicParsing).StatusCode -eq 200 } catch { $false }
  }
  $embeddedActionRoutes = foreach ($file in $capturedFiles) {
    $html = Get-Content -LiteralPath $file.FullName -Raw
    [regex]::Matches($html, 'data-action\s*=\s*["''](/admin/[^"''#]+)["'']') | ForEach-Object { $_.Groups[1].Value }
  }
  $embeddedActionRoutes = $embeddedActionRoutes | ForEach-Object { ($_ -split '\?')[0] } | Sort-Object -Unique
  $embeddedActionResults = foreach ($route in $embeddedActionRoutes) {
    try { ((Invoke-WebRequest -Uri ('http://127.0.0.1:8080' + $route) -Method Post -ContentType 'application/json' -Body '{"id":"1","status":"2"}' -UseBasicParsing).Content | ConvertFrom-Json).code -eq 1 } catch { $false }
  }

  # The compiled client uses code:0 for success; admin actions use code:1.
  if ($clientHome.StatusCode -ne 200 -or $backendHome.StatusCode -ne 200 -or $clientLogin.code -ne 0 -or $clientInfo.code -ne 0 -or $uploadInfo.code -ne 0 -or $expiredSession.code -ne 302 -or $adminLogin.code -ne 1 -or $adminPage.StatusCode -ne 200 -or $adminAction.code -ne 1 -or $modalPage.StatusCode -ne 200 -or @($actionResults | Where-Object { -not $_ }).Count -gt 0 -or @($modalResults | Where-Object { -not $_ }).Count -gt 0 -or @($embeddedActionResults | Where-Object { -not $_ }).Count -gt 0) {
    throw 'One or more portable smoke checks failed.'
  }

  [pscustomobject]@{
    Root = $rootPath
    Node = (& $nodePath --version).Trim()
    ClientHome = $clientHome.StatusCode
    BackendHome = $backendHome.StatusCode
    ClientLogin = $clientLogin.code
    ClientInfoGet = $clientInfo.code
    UploadInfoGet = $uploadInfo.code
    ExpiredSession = $expiredSession.code
    AdminLogin = $adminLogin.code
    AdminUsersPage = $adminPage.StatusCode
    AdminAction = $adminAction.code
    ModalPage = $modalPage.StatusCode
    AdminActionRoutes = $actionRoutes.Count
    AdminActionPasses = @($actionResults | Where-Object { $_ }).Count
    ReferencedModalRoutes = $modalRoutes.Count
    ReferencedModalPasses = @($modalResults | Where-Object { $_ }).Count
    EmbeddedActionRoutes = $embeddedActionRoutes.Count
    EmbeddedActionPasses = @($embeddedActionResults | Where-Object { $_ }).Count
    Result = 'PASS'
  } | ConvertTo-Json -Compress
} finally {
  if ($null -eq $oldPassword) { Remove-Item Env:LOCAL_ADMIN_PASSWORD -ErrorAction SilentlyContinue } else { $env:LOCAL_ADMIN_PASSWORD = $oldPassword }
  foreach ($process in @($client, $backend)) {
    if ($null -ne $process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force }
  }
}
