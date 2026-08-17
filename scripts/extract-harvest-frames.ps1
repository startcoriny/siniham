param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$OutputDirectory
)

Add-Type -AssemblyName System.Drawing
[System.IO.Directory]::CreateDirectory($OutputDirectory) | Out-Null
$sheet = [System.Drawing.Bitmap]::FromFile($Source)
$cellWidth = [int]($sheet.Width / 3)
$cellHeight = [int]($sheet.Height / 2)

for ($frame = 0; $frame -lt 6; $frame++) {
  $column = $frame % 3
  $row = [int][Math]::Floor($frame / 3)
  $rect = [System.Drawing.Rectangle]::new($column * $cellWidth, $row * $cellHeight, $cellWidth, $cellHeight)
  $cell = $sheet.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $visited = [bool[]]::new($cellWidth * $cellHeight)
  $queue = [System.Collections.Generic.Queue[int]]::new()

  for ($x = 0; $x -lt $cellWidth; $x++) { $queue.Enqueue($x); $queue.Enqueue(($cellHeight - 1) * $cellWidth + $x) }
  for ($y = 0; $y -lt $cellHeight; $y++) { $queue.Enqueue($y * $cellWidth); $queue.Enqueue($y * $cellWidth + $cellWidth - 1) }

  while ($queue.Count -gt 0) {
    $index = $queue.Dequeue()
    if ($visited[$index]) { continue }
    $visited[$index] = $true
    $x = $index % $cellWidth
    $y = [int][Math]::Floor($index / $cellWidth)
    $color = $cell.GetPixel($x, $y)
    $maximum = [Math]::Max($color.R, [Math]::Max($color.G, $color.B))
    $minimum = [Math]::Min($color.R, [Math]::Min($color.G, $color.B))
    $isLightNeutralBackground = $minimum -ge 220 -and ($maximum - $minimum) -le 10
    $isChromaGreenBackground = $color.G -ge 170 -and $color.G -ge ($color.R * 1.35) -and $color.G -ge ($color.B * 1.35)
    if (-not $isLightNeutralBackground -and -not $isChromaGreenBackground) { continue }
    $cell.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
    if ($x -gt 0) { $queue.Enqueue($index - 1) }
    if ($x + 1 -lt $cellWidth) { $queue.Enqueue($index + 1) }
    if ($y -gt 0) { $queue.Enqueue($index - $cellWidth) }
    if ($y + 1 -lt $cellHeight) { $queue.Enqueue($index + $cellWidth) }
  }

  $fileName = "frame-{0:D2}.png" -f ($frame + 1)
  $cell.Save((Join-Path $OutputDirectory $fileName), [System.Drawing.Imaging.ImageFormat]::Png)
  $cell.Dispose()
}

$sheet.Dispose()
