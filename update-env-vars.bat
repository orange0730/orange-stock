@echo off
echo 更新 Cloud Run 環境變量...

REM 更新環境變量（根據需要修改）
gcloud run services update orange-trade ^
  --region us-central1 ^
  --update-env-vars ^
    JWT_SECRET=your-secret-key-here,^
    SESSION_SECRET=your-session-secret-here,^
    NODE_ENV=production,^
    PORT=3000

echo 環境變量更新完成！