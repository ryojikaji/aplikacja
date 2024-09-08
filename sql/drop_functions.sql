-- Generate the drop statements for user-defined functions
DECLARE @sql NVARCHAR(MAX) = N'';

-- Select all user-defined functions
SELECT @sql += 'DROP FUNCTION ' + QUOTENAME(SCHEMA_NAME(schema_id)) + '.' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.objects
WHERE type IN (N'FN', N'IF', N'TF');

-- Print the SQL statements to verify before executing
PRINT @sql;

-- Uncomment the next line to execute the drop statements
-- EXEC sp_executesql @sql;
