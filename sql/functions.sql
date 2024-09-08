CREATE OR ALTER FUNCTION GetParents(@UserId INT, @RelationshipTypes NVARCHAR(20) = NULL)
RETURNS TABLE 
AS RETURN
(
	SELECT u.* FROM users u
	INNER JOIN relationships r
	ON r.parent_id = u.id
	WHERE r.child_id = @UserId
	AND (
		@RelationshipTypes IS NULL
		OR r.type IN (SELECT CAST(Value AS INT) FROM STRING_SPLIT(@RelationshipTypes, ','))
	)
);

CREATE OR ALTER FUNCTION GetChildren(@UserId INT, @RelationshipTypes NVARCHAR(20) = NULL)
RETURNS TABLE 
AS RETURN
(
	SELECT u.* FROM users u
	INNER JOIN relationships r
	ON r.child_id = u.id
	WHERE r.parent_id = @UserId
	AND (
		@RelationshipTypes IS NULL
		OR r.type IN (SELECT CAST(Value AS INT) FROM STRING_SPLIT(@RelationshipTypes, ','))
	)
);

CREATE OR ALTER FUNCTION GetEvents(
	@GiverIds NVARCHAR(100) = NULL,
	@ReceiverIds NVARCHAR(100) = NULL, 
	@Types NVARCHAR(20) = NULL,
	@States NVARCHAR(20) = NULL,
	@StartBefore DATETIME = NULL,
	@StartAfter DATETIME = NULL
)
RETURNS TABLE
AS RETURN
(
	SELECT * FROM [events]
	WHERE (
		@GiverIds IS NULL OR
		[giver_id] IN (SELECT CAST(Value AS INT) FROM STRING_SPLIT(@GiverIds, ','))
	)
	AND (
		@ReceiverIds IS NULL OR
		[receiver_id] IN (SELECT CAST(Value AS INT) FROM STRING_SPLIT(@ReceiverIds, ','))
	)
	AND (
		@Types IS NULL OR
		[type] IN (SELECT CAST(Value AS INT) FROM STRING_SPLIT(@Types, ','))
	)
	AND (
		@States IS NULL OR
		[state] IN (SELECT CAST(Value AS INT) FROM STRING_SPLIT(@States, ','))
	)
	AND (
		@StartBefore IS NULL OR
		[start_date] <= @StartBefore
	)
	AND (
		@StartAfter IS NULL OR
		[start_date] >= @StartAfter
	)
)