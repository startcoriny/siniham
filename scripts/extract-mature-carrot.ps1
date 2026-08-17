param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Output
)

Add-Type -AssemblyName System.Drawing
$atlas = [System.Drawing.Bitmap]::FromFile($Source)
$cellSize = [int][Math]::Floor($atlas.Width / 4)
$sourceY = $atlas.Height - $cellSize
$cell = $atlas.Clone(
  [System.Drawing.Rectangle]::new(0, $sourceY, $cellSize, $cellSize),
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)

# 성숙 당근 셀에서 흙은 아래쪽에만 존재한다. 몸통 중앙은 보존하고 양옆 흙만 제거한다.
$soilStartY = 172
for ($y = $soilStartY; $y -lt $cell.Height; $y++) {
  if ($y -lt 181) { $carrotLeft = 143; $carrotRight = 214 }
  elseif ($y -lt 191) { $carrotLeft = 146; $carrotRight = 211 }
  elseif ($y -lt 202) { $carrotLeft = 150; $carrotRight = 207 }
  else { $carrotLeft = 1; $carrotRight = 0 }
  for ($x = 0; $x -lt $cell.Width; $x++) {
    if ($x -ge $carrotLeft -and $x -le $carrotRight) { continue }
    $cell.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
  }
}

[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName((Resolve-Path (Split-Path $Output -Parent)))) | Out-Null
$cell.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$cell.Dispose()
$atlas.Dispose()
