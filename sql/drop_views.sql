-- Generate the drop statements for user-defined views
DECLARE @sql NVARCHAR(MAX) = N'';

-- Select all user-defined views
SELECT @sql += 'DROP VIEW ' + QUOTENAME(SCHEMA_NAME(schema_id)) + '.' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.views;

-- Print the SQL statements to verify before executing
PRINT @sql;

-- Uncomment the next line to execute the drop statements
-- EXEC sp_executesql @sql;
