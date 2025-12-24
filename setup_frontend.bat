@echo off
if not exist "TimeCapsule\frontend" mkdir TimeCapsule\frontend
cd TimeCapsule\frontend
call npx -y create-next-app@latest ./ --typescript --tailwind --eslint --no-src-dir --import-alias "@/*" --app
