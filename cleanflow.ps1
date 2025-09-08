# Script para remover arquivos específicos do Webflow da pasta static_files
# Remove: webflow.js, normalize.css, webflow.css

Write-Host "Iniciando limpeza dos arquivos Webflow..." -ForegroundColor Green

# Define os caminhos dos arquivos a serem removidos
$filesToRemove = @(
    "static_files\js\webflow.js",
    "static_files\css\normalize.css", 
    "static_files\css\webflow.css"
)

# Contador de arquivos removidos
$removedCount = 0

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force
            Write-Host "✓ Removido: $file" -ForegroundColor Yellow
            $removedCount++
        }
        catch {
            Write-Host "✗ Erro ao remover: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "- Arquivo não encontrado: $file" -ForegroundColor Gray
    }
}

Write-Host "`nLimpeza concluída! $removedCount arquivo(s) removido(s)." -ForegroundColor Green
