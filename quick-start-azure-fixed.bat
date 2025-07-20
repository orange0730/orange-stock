@echo off
echo ================================================
echo     Orange Trade Azure Web App Quick Start
echo ================================================
echo.

echo Welcome to Azure Web App deployment wizard!
echo.
echo Before we start, please make sure you have:
echo    - Azure account with valid subscription
echo    - Azure CLI installed and logged in
echo    - Unique application name ready
echo.

REM Check if Azure CLI is installed
echo Checking Azure CLI...
az --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Azure CLI not found
    echo Please install from: https://docs.microsoft.com/cli/azure/install-azure-cli
    pause
    exit /b 1
)
echo SUCCESS: Azure CLI is installed

REM Check login status
echo Checking login status...
az account show >nul 2>&1
if %errorlevel% neq 0 (
    echo Need to login to Azure...
    az login
    if %errorlevel% neq 0 (
        echo ERROR: Login failed
        pause
        exit /b 1
    )
)
echo SUCCESS: Logged in to Azure

echo.
echo Please enter your configuration:
echo.

REM Get application name
set /p APP_NAME="App name (e.g., my-orange-trade): "
if "%APP_NAME%"=="" (
    echo ERROR: Application name cannot be empty
    pause
    exit /b 1
)

REM Get resource group
set /p RESOURCE_GROUP="Resource group name (default: %APP_NAME%-rg): "
if "%RESOURCE_GROUP%"=="" set RESOURCE_GROUP=%APP_NAME%-rg

REM Get location
echo.
echo Choose deployment region:
echo    1. East Asia (Hong Kong)
echo    2. Southeast Asia (Singapore)
echo    3. Japan East
echo    4. Korea Central
echo    5. Australia East
echo.
set /p LOCATION_CHOICE="Select region (1-5, default: 1): "
if "%LOCATION_CHOICE%"=="" set LOCATION_CHOICE=1

if "%LOCATION_CHOICE%"=="1" set LOCATION=East Asia
if "%LOCATION_CHOICE%"=="2" set LOCATION=Southeast Asia
if "%LOCATION_CHOICE%"=="3" set LOCATION=Japan East
if "%LOCATION_CHOICE%"=="4" set LOCATION=Korea Central
if "%LOCATION_CHOICE%"=="5" set LOCATION=Australia East

echo.
echo Configuration summary:
echo    App name: %APP_NAME%
echo    Resource group: %RESOURCE_GROUP%
echo    Location: %LOCATION%
echo.

set /p CONFIRM="Confirm deployment? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Deployment cancelled
    pause
    exit /b 0
)

echo.
echo Starting deployment process...
echo.

REM Create resource group
echo Creating resource group...
az group create --name "%RESOURCE_GROUP%" --location "%LOCATION%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create resource group
    pause
    exit /b 1
)

REM Create App Service plan
echo Creating App Service plan...
az appservice plan create ^
    --name "%APP_NAME%-plan" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --location "%LOCATION%" ^
    --sku B1 ^
    --is-linux
if %errorlevel% neq 0 (
    echo ERROR: Failed to create App Service plan
    pause
    exit /b 1
)

REM Create Web App
echo Creating Web App...
az webapp create ^
    --name "%APP_NAME%" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --plan "%APP_NAME%-plan" ^
    --runtime "NODE|18-lts"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create Web App
    pause
    exit /b 1
)

REM Enable WebSocket
echo Enabling WebSocket support...
az webapp config set ^
    --name "%APP_NAME%" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --web-sockets-enabled true

REM Set basic environment variables
echo Setting basic environment variables...
az webapp config appsettings set ^
    --name "%APP_NAME%" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --settings ^
        NODE_ENV=production ^
        PORT=8080 ^
        WEBSITE_NODE_DEFAULT_VERSION=18-lts ^
        SCM_DO_BUILD_DURING_DEPLOYMENT=true

REM Create deployment package
echo Creating deployment package...
if exist "%APP_NAME%.zip" del "%APP_NAME%.zip"
powershell -Command "Compress-Archive -Path * -DestinationPath '%APP_NAME%.zip' -Force -CompressionLevel Optimal -Exclude @('node_modules', '.git', 'tests', '*.md')"

REM Deploy application
echo Deploying application...
az webapp deployment source config-zip ^
    --name "%APP_NAME%" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --src "%APP_NAME%.zip"

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo     DEPLOYMENT SUCCESSFUL!
    echo ================================================
    echo.
    echo Your app URL: https://%APP_NAME%.azurewebsites.net
    echo Azure Portal: https://portal.azure.com/
    echo.
    echo IMPORTANT NEXT STEPS:
    echo.
    echo 1. Set security environment variables:
    echo    - JWT_SECRET (JWT secret key)
    echo    - ADMIN_USERNAME (admin username)
    echo    - INITIAL_STOCK_PRICE (initial stock price)
    echo.
    echo 2. Set database connection (if using cloud database):
    echo    - Firestore or Cosmos DB related settings
    echo.
    echo 3. Set up monitoring:
    echo    - Enable Application Insights
    echo    - Set up alert rules
    echo.
    echo 4. Security settings:
    echo    - Set custom domain
    echo    - Enable SSL certificate
    echo    - Set HTTPS redirect
    echo.
    echo How to set environment variables:
    echo    1. Go to Azure Portal
    echo    2. Find your App Service: %APP_NAME%
    echo    3. Left menu - Configuration
    echo    4. Application settings - New application setting
    echo.
    echo For detailed guide: azure-deployment-guide.md
    echo.
) else (
    echo ERROR: Deployment failed, please check error messages
)

echo Cleaning up temporary files...
if exist "%APP_NAME%.zip" del "%APP_NAME%.zip"

echo.
echo Thank you for using Orange Trade Azure deployment wizard!
pause 