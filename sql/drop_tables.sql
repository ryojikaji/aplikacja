-- Variable to hold SQL statements
DECLARE @sql NVARCHAR(MAX) = N'';

-- Generate DROP TABLE statements for all user tables
SELECT @sql += 'DROP TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(object_id)) + '.' + 
               QUOTENAME(OBJECT_NAME(object_id)) + ';' + CHAR(13)
FROM sys.tables;

-- Print the SQL statements to verify before executing
PRINT @sql;

-- Uncomment the next line to execute the drop statements
-- EXEC sp_executesql @sql;
