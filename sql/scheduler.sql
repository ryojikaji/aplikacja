CREATE TABLE [users] (
	[id] int IDENTITY(1, 1) NOT NULL UNIQUE,
	[role] int NOT NULL,
	[created_at] datetime NOT NULL DEFAULT GETDATE(),
	[email] nvarchar(450),
	[password] nvarchar(450),
	[first_name] nvarchar(30),
	[last_name] nvarchar(30),
	[gender] int,
	[birth_date] datetime,
	[phone_number] nvarchar(20),
	[height_cm] int,
	[weight_kg] int,
	[postal_code] nvarchar(20),
	[street_address] nvarchar(100),
	[verification_token] nvarchar(450),
	[verified] bit NOT NULL DEFAULT 0,
	[fcm_token] nvarchar(450)
	PRIMARY KEY ([id])
);

CREATE TABLE [relationships] (
	[id] int IDENTITY(1,1) NOT NULL UNIQUE,
	[parent_id] int NOT NULL,
	[child_id] int NOT NULL,
	[type] int NOT NULL,
	[pending] bit NOT NULL DEFAULT 1
	PRIMARY KEY ([id])
);

CREATE TABLE [events] (
	[id] int IDENTITY(1, 1) NOT NULL UNIQUE,
	[type] int NOT NULL,
	[state] int NOT NULL,
	[giver_id] int NOT NULL,
	[receiver_id] int NOT NULL,
	[info] nvarchar(4000),
	[modified_at] datetime NOT NULL DEFAULT GETDATE(),
	[start_date] datetime NOT NULL,
	[duration_seconds] int,
	[end_date] AS DATEADD(SECOND, [duration_seconds], [start_date]) PERSISTED,
	[interval_seconds] int,
	PRIMARY KEY ([id])
);

CREATE TABLE [access_tokens] (
	[user_id] int NOT NULL,
	[hash] nvarchar(450) NOT NULL
)

ALTER TABLE [relationships] ADD CONSTRAINT [relationships_fk1] FOREIGN KEY ([parent_id]) REFERENCES [users]([id]);
ALTER TABLE [relationships] ADD CONSTRAINT [relationships_fk2] FOREIGN KEY ([child_id]) REFERENCES [users]([id]);

ALTER TABLE [events] ADD CONSTRAINT [events_fk3] FOREIGN KEY ([giver_id]) REFERENCES [users]([id]);
ALTER TABLE [events] ADD CONSTRAINT [events_fk4] FOREIGN KEY ([receiver_id]) REFERENCES [users]([id]);

ALTER TABLE [access_tokens] ADD CONSTRAINT [access_tokens_fk5] FOREIGN KEY ([user_id]) REFERENCES [users]([id])

CREATE INDEX [idx_users_role] ON [users] ([role])
CREATE INDEX [idx_users_email] ON [users] ([email])
CREATE INDEX [idx_users_verification_token] ON [users] ([verification_token])

CREATE INDEX [idx_events_giver_id] ON [events] ([giver_id], [start_date])
CREATE INDEX [idx_events_receiver_id] ON [events] ([receiver_id], [start_date])
CREATE INDEX [idx_events_queue] ON [events] ([id], [type], [state], [start_date])

CREATE INDEX [idx_relationships_parent_id] ON [relationships] ([parent_id])
CREATE INDEX [idx_relationships_child_id] ON [relationships] ([child_id])
CREATE INDEX [idx_relationships_type] ON [relationships] ([type])

CREATE INDEX [idx_access_tokens_user_id_hash] ON [access_tokens] ([user_id], [hash])