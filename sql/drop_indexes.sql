-- Variable to hold SQL statements
DECLARE @sql NVARCHAR(MAX) = N'';

-- Generate DROP INDEX statements for all indexes
SELECT @sql += 'DROP INDEX ' + QUOTENAME(i.name) + ' ON ' + 
               QUOTENAME(OBJECT_SCHEMA_NAME(i.object_id)) + '.' + 
               QUOTENAME(OBJECT_NAME(i.object_id)) + ';' + CHAR(13)
FROM sys.indexes i
WHERE i.type > 0;

-- Print the SQL statements to verify before executing
PRINT @sql;

-- Uncomment the next line to execute the drop statements
-- EXEC sp_executesql @sql;
