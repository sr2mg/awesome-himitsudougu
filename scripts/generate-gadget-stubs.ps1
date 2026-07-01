Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$registryPath = Join-Path $root "sources/wikipedia_pages.json"
$outputPath = Join-Path $root "data/gadget-stubs.json"
$cacheDir = Join-Path $root "work/wiki-section-cache"
$userAgent = "awesome-himitsudougu-stub-generator/0.1 (local dataset generation)"

$utf8 = [System.Text.Encoding]::UTF8
$registry = [System.IO.File]::ReadAllText($registryPath, $utf8) | ConvertFrom-Json
[System.IO.Directory]::CreateDirectory($cacheDir) | Out-Null

function Get-PageHash {
  param([string]$Value)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
  $hash = $sha.ComputeHash($bytes)
  $hex = [System.BitConverter]::ToString($hash).Replace("-", "").ToLowerInvariant()
  return $hex.Substring(0, 12)
}

function New-TextFromCodepoints {
  param([int[]]$Codepoints)
  return [string]::Concat(@($Codepoints | ForEach-Object { [char]$_ }))
}

function Get-ParseSections {
  param([string]$PageTitle)

  $escapedTitle = [System.Uri]::EscapeDataString($PageTitle)
  $uri = "https://ja.wikipedia.org/w/api.php?action=parse&page=$escapedTitle&prop=sections&format=json&formatversion=2&redirects=1&origin=*&maxlag=5"
  $cachePath = Join-Path $cacheDir "$((Get-PageHash $PageTitle)).sections.json"

  if ([System.IO.File]::Exists($cachePath)) {
    return @([System.IO.File]::ReadAllText($cachePath, $utf8) | ConvertFrom-Json)
  }

  $attempts = 0

  while ($true) {
    try {
      $response = Invoke-RestMethod -Uri $uri -UserAgent $userAgent -Headers @{
        "Api-User-Agent" = $userAgent
      }
      $sections = @($response.parse.sections)
      [System.IO.File]::WriteAllText($cachePath, ($sections | ConvertTo-Json -Depth 10), $utf8)
      return $sections
    } catch {
      $attempts += 1
      if ($attempts -ge 5) {
        throw
      }

      $delaySeconds = @(5, 15, 30, 60)[$attempts - 1]
      Write-Warning "Request failed for $PageTitle. Retrying in $delaySeconds seconds. Attempt $attempts."
      Start-Sleep -Seconds $delaySeconds
    }
  }
}

function New-SourceObject {
  param(
    [object]$Page,
    [object]$SectionAnchor
  )

  [ordered]@{
    site_name = $registry.source_name
    page_id = $Page.page_id
    page_title = $Page.page_title
    page_url = $Page.url
    page_kind = $Page.kind
    group = if ($Page.PSObject.Properties.Name -contains "group") { $Page.group } else { $null }
    label = if ($Page.PSObject.Properties.Name -contains "label") { $Page.label } else { $null }
    section_anchor = $SectionAnchor
  }
}

# Keep source code ASCII-only for Windows PowerShell compatibility.
$nonEntryHeadings = @(
  (New-TextFromCodepoints @(0x6982, 0x8981)),
  (New-TextFromCodepoints @(0x89e3, 0x8aac)),
  (New-TextFromCodepoints @(0x811a, 0x6ce8)),
  (New-TextFromCodepoints @(0x811a, 0x6ce8, 0x30fb, 0x51fa, 0x5178)),
  (New-TextFromCodepoints @(0x6ce8, 0x91c8)),
  (New-TextFromCodepoints @(0x51fa, 0x5178)),
  (New-TextFromCodepoints @(0x53c2, 0x8003, 0x6587, 0x732e)),
  (New-TextFromCodepoints @(0x95a2, 0x9023, 0x9805, 0x76ee)),
  (New-TextFromCodepoints @(0x5916, 0x90e8, 0x30ea, 0x30f3, 0x30af))
)

$stubs = New-Object System.Collections.Generic.List[object]
$seenNames = @{}
$pageOrder = 0

foreach ($page in @($registry.individual_articles)) {
  $pageHash = Get-PageHash -Value ([string]($page.page_id))
  $name = [string]$page.name
  $kind = if ($seenNames.ContainsKey($name)) { "duplicate_candidate" } else { "candidate" }
  if (-not $seenNames.ContainsKey($name)) {
    $seenNames[$name] = "jawp:${pageHash}:article"
  }

  $stubs.Add([ordered]@{
    stub_id = "jawp:${pageHash}:article"
    record_id = $null
    name = $name
    raw_heading = $null
    source = New-SourceObject -Page $page -SectionAnchor $null
    position = [ordered]@{
      page_order = $pageOrder
      item_order = 0
    }
    kind = $kind
    redirect_to = $null
    notes = "Generated from the individual article registry."
  })

  $pageOrder += 1
}

foreach ($page in @($registry.index_pages)) {
  $pageHash = Get-PageHash -Value ([string]($page.page_id))
  $sections = Get-ParseSections $page.page_title
  $itemOrder = 0

  foreach ($section in $sections) {
    if ([int]$section.level -ne 2) {
      continue
    }

    $name = [string]$section.line
    if ($nonEntryHeadings -contains $name) {
      continue
    }

    $kind = if ($seenNames.ContainsKey($name)) { "duplicate_candidate" } else { "candidate" }
    $stubId = "jawp:${pageHash}:s$($section.index)"
    if (-not $seenNames.ContainsKey($name)) {
      $seenNames[$name] = $stubId
    }

    $stubs.Add([ordered]@{
      stub_id = $stubId
      record_id = $null
      name = $name
      raw_heading = $name
      source = New-SourceObject -Page $page -SectionAnchor ([string]$section.anchor)
      position = [ordered]@{
        page_order = $pageOrder
        item_order = $itemOrder
      }
      kind = $kind
      redirect_to = $null
      notes = "Generated from a level-2 MediaWiki section heading."
    })

    $itemOrder += 1
  }

  $pageOrder += 1
  Start-Sleep -Milliseconds 1200
}

$dataset = [ordered]@{
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  source_registry = [ordered]@{
    path = "sources/wikipedia_pages.json"
    schema = "schemas/wikipedia-pages.schema.json"
    source_name = $registry.source_name
  }
  stubs = @($stubs.ToArray())
}

[System.IO.File]::WriteAllText($outputPath, ($dataset | ConvertTo-Json -Depth 20), $utf8)

$summary = [ordered]@{
  output = $outputPath
  total_stubs = $stubs.Count
  candidates = @($stubs | Where-Object { $_.kind -eq "candidate" }).Count
  duplicate_candidates = @($stubs | Where-Object { $_.kind -eq "duplicate_candidate" }).Count
}

$summary | ConvertTo-Json -Depth 5
