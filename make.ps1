if ( Test-Path 'dist' ) {
    Remove-Item -Path 'dist' -Recurse
}
New-Item -Path 'dist' -ItemType Directory
Copy-Item -Path 'chromium' -Destination 'dist/chromium' -Recurse
Remove-Item -Path 'dist/chromium/ui/style.scss'
Compress-Archive -Path 'dist/chromium/*' -DestinationPath 'dist/chromium.zip'

Copy-Item -Path 'dist/chromium' -Destination 'dist/chromium-jmana' -Recurse
Remove-Item -Path 'dist/chromium-jmana/modules/*'
Copy-Item -Path 'chromium-jmana/*' -Destination 'dist/chromium-jmana' -Recurse -Force
Compress-Archive -Path 'dist/chromium-jmana/*' -DestinationPath 'dist/chromium-jmana.zip'

Copy-Item -Path 'dist/chromium' -Destination 'dist/gecko' -Recurse
Copy-Item -Path 'gecko/*' -Destination 'dist/gecko' -Recurse -Force
Remove-Item -Path 'dist/gecko/ui/style.scss'
Compress-Archive -Path 'dist/gecko/*' -DestinationPath 'dist/firefox.zip'
