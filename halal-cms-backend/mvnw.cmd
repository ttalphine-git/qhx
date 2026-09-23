@REM Maven Wrapper for Windows
@REM
@REM This script wraps Maven execution.

@echo off
setlocal enabledelayedexpansion

set MAVEN_PROJECTBASEDIR=%~dp0

if exist "%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar" (
    set MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar
    set MAVEN_WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties

    echo Downloading maven-wrapper.jar...
    powershell -Command "(New-Object Net.WebClient).DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar', '%MAVEN_WRAPPER_JAR%')"
)

if not exist "%MAVEN_WRAPPER_JAR%" (
    echo Error: Maven wrapper jar not found
    exit /b 1
)

java -cp "%MAVEN_WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
endlocal
