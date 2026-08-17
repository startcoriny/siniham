param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Output,
  [int]$Size = 512
)

Add-Type -AssemblyName System.Drawing
$sourceImage = [System.Drawing.Bitmap]::FromFile($Source)
$transparent = [System.Drawing.Bitmap]::new($sourceImage.Width, $sourceImage.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $sourceImage.Height; $y++) {
  for ($x = 0; $x -lt $sourceImage.Width; $x++) {
    $color = $sourceImage.GetPixel($x, $y)
    $isChromaGreen = $color.G -ge 150 -and $color.G -ge ($color.R * 1.3) -and $color.G -ge ($color.B * 1.3)
    $transparent.SetPixel($x, $y, $(if ($isChromaGreen) { [System.Drawing.Color]::Transparent } else { $color }))
  }
}

$result = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($result)
$graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$graphics.DrawImage($transparent, 0, 0, $Size, $Size)
$graphics.Dispose()

$result.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$result.Dispose()
$transparent.Dispose()
$sourceImage.Dispose()
