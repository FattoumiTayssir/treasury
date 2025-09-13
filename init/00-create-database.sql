-- Idempotently create database and set basic options
-- Requires sqlcmd variable: $(DB_NAME)

-- Create DB if it doesn't exist
IF DB_ID(N'$(DB_NAME)') IS NULL
BEGIN
    DECLARE @sql nvarchar(max) = N'CREATE DATABASE [' + REPLACE('$(DB_NAME)', ']', ']]') + N']';
    EXEC(@sql);
END
GO

-- Set recommended options
DECLARE @sql2 nvarchar(max);
SET @sql2 = N'ALTER DATABASE [' + REPLACE('$(DB_NAME)', ']', ']]') + N'] SET RECOVERY SIMPLE';
EXEC(@sql2);
GO

-- Switch to database
DECLARE @sql3 nvarchar(max);
SET @sql3 = N'USE [' + REPLACE('$(DB_NAME)', ']', ']]') + N']';
EXEC(@sql3);
GO
