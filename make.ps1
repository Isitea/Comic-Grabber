if ( Test-Path 'dist' ) {
    Remove-Item -Path 'dist' -Recurse
}
New-Item -Path 'dist' -ItemType Directory
Copy-Item -Path 'chromium' -Destination 'dist/chromium' -Recurse
Remove-Item -Path 'dist/chromium/ui/style.scss'

Copy-Item -Path 'dist/chromium' -Destination 'dist/chromium-webRequest' -Recurse
Copy-Item -Path 'chromium-webRequest/*' -Destination 'dist/chromium-webRequest' -Recurse -Force

Copy-Item -Path 'dist/chromium' -Destination 'dist/gecko' -Recurse
Copy-Item -Path 'gecko/*' -Destination 'dist/gecko' -Recurse -Force
#Remove-Item -Path 'dist/gecko/ui/style.scss'

#$ArcOpt = @{ CompressionLevel = "Optimal" }
#Compress-Archive -Path 'dist/chromium/*' -DestinationPath 'dist/chromium.zip' @ArcOpt
#Compress-Archive -Path 'dist/chromium-webRequest/*' -DestinationPath 'dist/chromium-webRequest.zip' @ArcOpt
#Compress-Archive -Path 'dist/gecko/*' -DestinationPath 'dist/firefox.zip' @ArcOpt
