@echo off
setlocal enabledelayedexpansion

set "envFile=.env"
set "defaultServerPort=5050"

if exist %envFile% (
  for /f "usebackq tokens=1* delims=" %%a in ("%envFile%") do (
    set "line=%%a"
    if not "!line:~0,1!" == "#" (
      for /f "tokens=1* delims==" %%b in ("%%a") do (
        if /I "%%b"=="SERVER_PORT" set "SERVER_PORT=%%c"
      )
    )
  )
) else (
  echo The file %envFile% does not exist.
  timeout /t 10
  exit
)

if not defined SERVER_PORT (
  echo SERVER_PORT is not set in the .env file. Using the default port: %defaultServerPort%
  set "SERVER_PORT=%defaultServerPort%"
)

call npm start
echo Server listening on port %SERVER_PORT% at: http://localhost:%SERVER_PORT%
start "" http://localhost:%SERVER_PORT%
call npm run monit
timeout /t 10
endlocal