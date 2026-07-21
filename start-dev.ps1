# Start development with both API server and dev server
Write-Host "🚀 Starting Supabase Inventory App..." -ForegroundColor Green

# Set environment variable
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldGxqZnVocHJpbm1zcXp0cXlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2NTU5NCwiZXhwIjoyMDkwMDQxNTk0fQ.ysPpSfRlTALCIc5FSw0ovN_xPUfC01z_8_NtWMaeSuQ"

# Run dev:all script
npm run dev:all
