#requires -Version 7.0
[CmdletBinding()]
param(
    [ValidateSet('stdio', 'http')]
    [string]$Transport = $env:MCP_SMOKE_TRANSPORT,

    [string]$HttpUrl = $env:MCP_SMOKE_HTTP_URL
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Transport)) {
    $Transport = 'stdio'
}

function Resolve-ProjectRoot {
    return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..' '..')).Path
}

function New-SafeSmokeEnvironment {
    param([string]$ProjectRoot)

    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("ssh-mcp-universal-smoke-" + [System.Guid]::NewGuid().ToString('N'))
    $homePath = Join-Path $tempRoot 'home'
    New-Item -ItemType Directory -Path $homePath -Force | Out-Null

    $configPath = Join-Path $tempRoot 'ssh-config.toml'
    @(
        '# Safe PowerShell smoke inventory fixture.'
        '# Empty on purpose: the smoke test must not read real SSH targets or secrets.'
        '[ssh_servers]'
    ) | Set-Content -LiteralPath $configPath -Encoding UTF8

    return [pscustomobject]@{
        Root = $tempRoot
        Home = $homePath
        Config = $configPath
        Project = $ProjectRoot
    }
}

function ConvertTo-JsonLine {
    param([hashtable]$Message)
    return ($Message | ConvertTo-Json -Depth 20 -Compress)
}

function Get-OptionalProperty {
    param(
        [Parameter(Mandatory)]
        [object]$Object,

        [Parameter(Mandatory)]
        [string]$Name
    )

    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) {
        return $null
    }
    return $property.Value
}

function Read-JsonRpcMessage {
    param(
        [Parameter(Mandatory)]
        [System.Diagnostics.Process]$Process,

        [Parameter(Mandatory)]
        [int]$ExpectedId,

        [int]$TimeoutSeconds = 15
    )

    $deadline = [DateTimeOffset]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTimeOffset]::UtcNow -lt $deadline) {
        if ($Process.HasExited) {
            $stderr = $Process.StandardError.ReadToEnd()
            throw "MCP server exited before JSON-RPC response id=$ExpectedId. ExitCode=$($Process.ExitCode). Stderr: $stderr"
        }

        $readTask = $Process.StandardOutput.ReadLineAsync()
        if (-not $readTask.Wait(250)) {
            continue
        }

        $line = $readTask.Result
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $message = $line | ConvertFrom-Json -Depth 50
        } catch {
            continue
        }

        $messageId = Get-OptionalProperty -Object $message -Name 'id'
        if ($null -ne $messageId -and [int]$messageId -eq $ExpectedId) {
            $messageError = Get-OptionalProperty -Object $message -Name 'error'
            if ($null -ne $messageError) {
                throw "JSON-RPC id=$ExpectedId returned error: $($messageError | ConvertTo-Json -Depth 20 -Compress)"
            }
            return $message
        }
    }

    throw "Timed out waiting for JSON-RPC response id=$ExpectedId"
}

function Invoke-StdioSmoke {
    param([string]$ProjectRoot)

    $safeEnv = New-SafeSmokeEnvironment -ProjectRoot $ProjectRoot
    $process = $null

    try {
        $nodeCommand = if ($IsWindows) { 'node.exe' } else { 'node' }
        $serverPath = Join-Path $ProjectRoot 'src' 'index.js'

        $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
        $startInfo.FileName = $nodeCommand
        $startInfo.WorkingDirectory = $ProjectRoot
        $startInfo.UseShellExecute = $false
        $startInfo.RedirectStandardInput = $true
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        $startInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        $startInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8
        $startInfo.Environment['SSH_CONFIG_PATH'] = $safeEnv.Config
        $startInfo.Environment['HOME'] = $safeEnv.Home
        $startInfo.Environment['USERPROFILE'] = $safeEnv.Home
        $startInfo.ArgumentList.Add($serverPath)

        $process = [System.Diagnostics.Process]::Start($startInfo)
        if ($null -eq $process) {
            throw 'Failed to start MCP server process.'
        }

        $initialize = @{
            jsonrpc = '2.0'
            id = 1
            method = 'initialize'
            params = @{
                protocolVersion = '2025-06-18'
                capabilities = @{}
                clientInfo = @{
                    name = 'ssh-mcp-universal-pwsh-smoke'
                    version = '1.0.0'
                }
            }
        }

        $process.StandardInput.WriteLine((ConvertTo-JsonLine -Message $initialize))
        $process.StandardInput.Flush()
        $initResponse = Read-JsonRpcMessage -Process $process -ExpectedId 1

        if ([string]::IsNullOrWhiteSpace($initResponse.result.serverInfo.name)) {
            throw 'Initialize response did not include serverInfo.name.'
        }

        $initialized = @{
            jsonrpc = '2.0'
            method = 'notifications/initialized'
            params = @{}
        }
        $process.StandardInput.WriteLine((ConvertTo-JsonLine -Message $initialized))
        $process.StandardInput.Flush()

        $toolsList = @{
            jsonrpc = '2.0'
            id = 2
            method = 'tools/list'
            params = @{}
        }
        $process.StandardInput.WriteLine((ConvertTo-JsonLine -Message $toolsList))
        $process.StandardInput.Flush()
        $toolsResponse = Read-JsonRpcMessage -Process $process -ExpectedId 2

        $toolNames = @($toolsResponse.result.tools | ForEach-Object { $_.name })
        if ($toolNames.Count -ne 37) {
            throw "Expected 37 tools, got $($toolNames.Count)."
        }
        foreach ($requiredTool in @('ssh_list_servers', 'ssh_execute')) {
            if ($toolNames -notcontains $requiredTool) {
                throw "Required tool '$requiredTool' is missing."
            }
        }

        [pscustomobject]@{
            ok = $true
            transport = 'stdio'
            serverName = $initResponse.result.serverInfo.name
            toolCount = $toolNames.Count
            requiredTools = @('ssh_list_servers', 'ssh_execute')
            safeConfigPath = $safeEnv.Config
        } | ConvertTo-Json -Depth 10
    } finally {
        if ($null -ne $process -and -not $process.HasExited) {
            try {
                $shutdown = @{
                    jsonrpc = '2.0'
                    id = 3
                    method = 'shutdown'
                    params = @{}
                }
                $process.StandardInput.WriteLine((ConvertTo-JsonLine -Message $shutdown))
                $process.StandardInput.Flush()
            } catch {
            }

            if (-not $process.WaitForExit(1500)) {
                $process.Kill($true)
                $process.WaitForExit(3000) | Out-Null
            }
        }

        if (Test-Path -LiteralPath $safeEnv.Root) {
            Remove-Item -LiteralPath $safeEnv.Root -Recurse -Force
        }
    }
}

function Invoke-HttpSmoke {
    param([string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        throw 'HTTP smoke requires MCP_SMOKE_HTTP_URL or -HttpUrl.'
    }

    $initialize = @{
        jsonrpc = '2.0'
        id = 1
        method = 'initialize'
        params = @{
            protocolVersion = '2025-06-18'
            capabilities = @{}
            clientInfo = @{
                name = 'ssh-mcp-universal-pwsh-smoke'
                version = '1.0.0'
            }
        }
    }

    $initResponse = Invoke-RestMethod -Method Post -Uri $Url -ContentType 'application/json' -Body (ConvertTo-JsonLine -Message $initialize)
    $initError = Get-OptionalProperty -Object $initResponse -Name 'error'
    if ($null -ne $initError) {
        throw "HTTP initialize failed: $($initError | ConvertTo-Json -Depth 20 -Compress)"
    }

    $toolsList = @{
        jsonrpc = '2.0'
        id = 2
        method = 'tools/list'
        params = @{}
    }
    $toolsResponse = Invoke-RestMethod -Method Post -Uri $Url -ContentType 'application/json' -Body (ConvertTo-JsonLine -Message $toolsList)
    $toolsError = Get-OptionalProperty -Object $toolsResponse -Name 'error'
    if ($null -ne $toolsError) {
        throw "HTTP tools/list failed: $($toolsError | ConvertTo-Json -Depth 20 -Compress)"
    }

    [pscustomobject]@{
        ok = $true
        transport = 'http'
        url = $Url
        toolCount = @($toolsResponse.result.tools).Count
    } | ConvertTo-Json -Depth 10
}

$projectRoot = Resolve-ProjectRoot

try {
    if ($Transport -eq 'stdio') {
        Invoke-StdioSmoke -ProjectRoot $projectRoot
    } else {
        Invoke-HttpSmoke -Url $HttpUrl
    }
    exit 0
} catch {
    Write-Error $_
    exit 1
}
