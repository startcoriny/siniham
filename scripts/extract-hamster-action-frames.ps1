param(
    [Parameter(Mandatory = $true)][string]$SheetPath,
    [Parameter(Mandatory = $true)][int]$Columns,
    [Parameter(Mandatory = $true)][int]$Rows,
    [Parameter(Mandatory = $true)][string]$OutputDirectory,
    [Parameter(Mandatory = $true)][ValidateSet('eat', 'drink', 'wash', 'sleep')][string]$Behavior
)

# AI로 만든 단색 마젠타 배경의 행동 시트를 투명한 512px 프레임으로 분리한다.
Add-Type -AssemblyName System.Drawing

$canvasSize = 512
$baselineY = 500
$targetAreaSqrt = 260
$scaleOverrides = @{ eat = 1.06; drink = 1.10; wash = 1.06; sleep = 1.06 }
$sheet = [System.Drawing.Bitmap]::new((Resolve-Path -LiteralPath $SheetPath).Path)
[System.IO.Directory]::CreateDirectory($OutputDirectory) | Out-Null

try {
    for ($index = 0; $index -lt $Columns * $Rows; $index++) {
        $column = $index % $Columns
        $row = [Math]::Floor($index / $Columns)
        $left = [Math]::Round($column * $sheet.Width / $Columns)
        $right = [Math]::Round(($column + 1) * $sheet.Width / $Columns)
        $top = [Math]::Round($row * $sheet.Height / $Rows)
        $bottom = [Math]::Round(($row + 1) * $sheet.Height / $Rows)

        $minX = $right
        $minY = $bottom
        $maxX = -1
        $maxY = -1
        $opaqueArea = 0
        for ($y = $top; $y -lt $bottom; $y++) {
            for ($x = $left; $x -lt $right; $x++) {
                $color = $sheet.GetPixel($x, $y)
                $isMagenta = $color.R -gt 180 -and $color.B -gt 150 -and
                    $color.R - $color.G -gt 70 -and $color.B - $color.G -gt 55
                if (-not $isMagenta) {
                    $opaqueArea++
                    $minX = [Math]::Min($minX, $x)
                    $minY = [Math]::Min($minY, $y)
                    $maxX = [Math]::Max($maxX, $x)
                    $maxY = [Math]::Max($maxY, $y)
                }
            }
        }
        if ($opaqueArea -eq 0) { throw "Frame $($index + 1) has no subject." }

        $cropWidth = $maxX - $minX + 1
        $cropHeight = $maxY - $minY + 1
        $scale = ($targetAreaSqrt / [Math]::Sqrt($opaqueArea)) * $scaleOverrides[$Behavior]
        $scale = [Math]::Min($scale, 488 / $cropWidth)
        $scale = [Math]::Min($scale, 488 / $cropHeight)
        $targetWidth = [Math]::Max(1, [Math]::Round($cropWidth * $scale))
        $targetHeight = [Math]::Max(1, [Math]::Round($cropHeight * $scale))

        $cropped = [System.Drawing.Bitmap]::new($cropWidth, $cropHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        for ($y = 0; $y -lt $cropHeight; $y++) {
            for ($x = 0; $x -lt $cropWidth; $x++) {
                $color = $sheet.GetPixel($minX + $x, $minY + $y)
                $isMagenta = $color.R -gt 180 -and $color.B -gt 150 -and
                    $color.R - $color.G -gt 70 -and $color.B - $color.G -gt 55
                $cropped.SetPixel($x, $y, $(if ($isMagenta) { [System.Drawing.Color]::Transparent } else { $color }))
            }
        }

        $canvas = [System.Drawing.Bitmap]::new($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($canvas)
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
            $destination = [System.Drawing.Rectangle]::new(
                [Math]::Floor(($canvasSize - $targetWidth) / 2),
                $baselineY - $targetHeight,
                $targetWidth,
                $targetHeight
            )
            $graphics.DrawImage($cropped, $destination)
        } finally {
            $graphics.Dispose()
            $cropped.Dispose()
        }

        $frameName = 'frame-{0:D2}.png' -f ($index + 1)
        $outputPath = Join-Path $OutputDirectory $frameName
        $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $canvas.Dispose()
    }
} finally {
    $sheet.Dispose()
}

Write-Output "$Behavior`: $($Columns * $Rows) frames -> $OutputDirectory"
