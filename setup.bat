@echo off
echo ========================================
echo   ARENA - Epic Battle Game Setup
echo ========================================
echo.

where ruby >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ruby not found. Please install Ruby 3.4.9+
    pause
    exit /b 1
)

echo [1/5] Ruby found. Installing gems...
call gem install bundler --no-document
call bundle install

echo.
echo [2/5] Setting up database...
call bundle exec rails db:create
call bundle exec rails db:migrate
call bundle exec rails db:seed

echo.
echo [3/5] Assets ready (compile on first request)

echo.
echo [4/5] Starting server...
echo.
echo ========================================
echo   Game running at: http://localhost:3000
echo   Press Ctrl+C to stop
echo ========================================
echo.
call bundle exec rails server -p 3000
