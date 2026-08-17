param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Output,
  [Parameter(Mandatory = $true)][int]$Left,
  [Parameter(Mandatory = $true)][int]$Top,
  [Parameter(Mandatory = $true)][int]$Right,
  [Parameter(Mandatory = $true)][int]$Bottom
)

Add-Type -AssemblyName System.Drawing
$sourceImage = [System.Drawing.Bitmap]::FromFile($Source)
$layer = [System.Drawing.Bitmap]::new($sourceImage.Width, $sourceImage.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = $Top; $y -le $Bottom; $y++) {
  for ($x = $Left; $x -le $Right; $x++) {
    $layer.SetPixel($x, $y, $sourceImage.GetPixel($x, $y))
  }
}

$layer.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$layer.Dispose()
$sourceImage.Dispose()
