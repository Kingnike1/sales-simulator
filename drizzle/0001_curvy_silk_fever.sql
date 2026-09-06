CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`overallScore` int NOT NULL,
	`scoresJson` text NOT NULL,
	`positivesJson` text NOT NULL,
	`improvementsJson` text NOT NULL,
	`mistakesJson` text NOT NULL,
	`criticalMomentsJson` text NOT NULL,
	`betterResponsesJson` text NOT NULL,
	`nextRecommendation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` varchar(16) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`overallScore` int NOT NULL,
	`discoveryScore` int NOT NULL,
	`objectionScore` int NOT NULL,
	`closingScore` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mode` varchar(24) NOT NULL,
	`focusNeed` varchar(191),
	`difficulty` varchar(24) NOT NULL,
	`segment` varchar(191) NOT NULL,
	`clientType` varchar(191) NOT NULL,
	`personality` varchar(191) NOT NULL,
	`apparentNeed` text NOT NULL,
	`realNeed` text NOT NULL,
	`goal` text NOT NULL,
	`objectionsJson` text NOT NULL,
	`budget` varchar(191) NOT NULL,
	`interestLevel` varchar(64) NOT NULL,
	`context` text NOT NULL,
	`successCriteria` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`mode` varchar(24) NOT NULL,
	`difficulty` varchar(24) NOT NULL,
	`status` varchar(24) NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` varchar(20) NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_session_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `training_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_session_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `training_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_metrics` ADD CONSTRAINT `performance_metrics_session_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `training_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_sessions` ADD CONSTRAINT `training_sessions_scenario_id_fk` FOREIGN KEY (`scenarioId`) REFERENCES `scenarios`(`id`) ON DELETE no action ON UPDATE no action;