import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1771239550973 implements MigrationInterface {
    name = 'InitialSchema1771239550973';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."users_role_enum" AS ENUM('PROJECT_OWNER', 'TEAM_MEMBER', 'ADMIN')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'SUSPENDED', 'DELETED')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."users_digest_frequency_enum" AS ENUM('OFF', 'DAILY', 'WEEKLY')`,
        );
        await queryRunner.query(
            `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "email" character varying NOT NULL, "password" character varying, "first_name" character varying, "last_name" character varying, "full_name" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'TEAM_MEMBER', "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE', "email_verified" boolean NOT NULL DEFAULT false, "device_fcm_tokens" jsonb DEFAULT '[]', "refresh_token" text, "remember_me" boolean DEFAULT false, "job_title" character varying(255), "profile_photo_url" character varying(512), "google_id" character varying(255), "push_enabled" boolean NOT NULL DEFAULT true, "digest_frequency" "public"."users_digest_frequency_enum" NOT NULL DEFAULT 'OFF', "notify_task_assigned" boolean NOT NULL DEFAULT true, "notify_due_date_reminder" boolean NOT NULL DEFAULT true, "notify_status_change" boolean NOT NULL DEFAULT true, "notify_comment_mention" boolean NOT NULL DEFAULT true, "notify_new_comment" boolean NOT NULL DEFAULT true, "notify_invitation" boolean NOT NULL DEFAULT true, "last_active_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_users_role" ON "users" ("role") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_users_status" ON "users" ("status") `,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_users_google_id" ON "users" ("google_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "user_devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "token" character varying(500) NOT NULL, "platform" character varying(10) NOT NULL, "device_name" character varying(100), CONSTRAINT "UQ_241f440058ea34377edd80db924" UNIQUE ("token"), CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_user_devices_user_id" ON "user_devices" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_user_devices_token" ON "user_devices" ("token") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."project_members_project_role_enum" AS ENUM('OWNER', 'MEMBER')`,
        );
        await queryRunner.query(
            `CREATE TABLE "project_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "project_role" "public"."project_members_project_role_enum" NOT NULL DEFAULT 'MEMBER', "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_project_members_project_user" UNIQUE ("project_id", "user_id"), CONSTRAINT "PK_0b2f46f804be4aea9234c78bcc9" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_project_members_user_id" ON "project_members" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_project_members_project_id" ON "project_members" ("project_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "columns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "project_id" uuid NOT NULL, "title" character varying(100) NOT NULL, "position" integer NOT NULL DEFAULT '0', "wip_limit" integer, CONSTRAINT "UQ_columns_project_position" UNIQUE ("project_id", "position"), CONSTRAINT "PK_4ac339ccbbfed1dcd96812abbd5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_columns_project_id" ON "columns" ("project_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "labels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "project_id" uuid, "name" character varying(100) NOT NULL, "color" character varying(7) NOT NULL, CONSTRAINT "UQ_labels_project_name" UNIQUE ("project_id", "name"), CONSTRAINT "PK_c0c4e97f76f1f3a268c7a70b925" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_labels_project_id" ON "labels" ("project_id") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."invitations_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')`,
        );
        await queryRunner.query(
            `CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "project_id" uuid NOT NULL, "inviter_id" uuid NOT NULL, "email" character varying(255) NOT NULL, "status" "public"."invitations_status_enum" NOT NULL DEFAULT 'PENDING', "token" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_invitations_status" ON "invitations" ("status") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_invitations_email" ON "invitations" ("email") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_invitations_project_id" ON "invitations" ("project_id") `,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_invitations_token" ON "invitations" ("token") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."activity_logs_action_enum" AS ENUM('TASK_CREATED', 'TASK_UPDATED', 'TASK_MOVED', 'TASK_DELETED', 'TASK_RESTORED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'COLUMN_CREATED', 'COLUMN_UPDATED', 'COLUMN_DELETED', 'PROJECT_UPDATED', 'PROJECT_ARCHIVED', 'SUB_TASK_ADDED', 'SUB_TASK_COMPLETED', 'TIME_LOGGED')`,
        );
        await queryRunner.query(
            `CREATE TABLE "activity_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "project_id" uuid NOT NULL, "task_id" uuid, "user_id" uuid, "action" "public"."activity_logs_action_enum" NOT NULL, "details" jsonb, CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_activity_logs_created_at" ON "activity_logs" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_activity_logs_project_created_at" ON "activity_logs" ("project_id", "created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_activity_logs_user_id" ON "activity_logs" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_activity_logs_task_id" ON "activity_logs" ("task_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_activity_logs_project_id" ON "activity_logs" ("project_id") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."projects_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."projects_template_enum" AS ENUM('DEFAULT', 'MINIMAL', 'CUSTOM')`,
        );
        await queryRunner.query(
            `CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying(255) NOT NULL, "description" text, "owner_id" uuid NOT NULL, "status" "public"."projects_status_enum" NOT NULL DEFAULT 'ACTIVE', "template" "public"."projects_template_enum" NOT NULL DEFAULT 'DEFAULT', "deadline" date, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_projects_deadline" ON "projects" ("deadline") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_projects_created_at" ON "projects" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_projects_status" ON "projects" ("status") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_projects_owner_id" ON "projects" ("owner_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "sub_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "task_id" uuid NOT NULL, "title" character varying(500) NOT NULL, "is_completed" boolean NOT NULL DEFAULT false, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_0028874355f68f2ed21a89c2faf" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_sub_tasks_task_position" ON "sub_tasks" ("task_id", "position") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_sub_tasks_task_id" ON "sub_tasks" ("task_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "task_id" uuid NOT NULL, "user_id" uuid NOT NULL, "parent_id" uuid, "content" text NOT NULL, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_comments_task_created_at" ON "comments" ("task_id", "created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_comments_parent_id" ON "comments" ("parent_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_comments_user_id" ON "comments" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_comments_task_id" ON "comments" ("task_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "task_id" uuid NOT NULL, "uploader_id" uuid, "file_name" character varying(255) NOT NULL, "file_url" character varying(1024) NOT NULL, "file_type" character varying(50) NOT NULL, "file_size" integer NOT NULL, CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_attachments_uploader_id" ON "attachments" ("uploader_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_attachments_task_id" ON "attachments" ("task_id") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')`,
        );
        await queryRunner.query(
            `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "project_id" uuid NOT NULL, "column_id" uuid NOT NULL, "creator_id" uuid, "assignee_id" uuid, "title" character varying(500) NOT NULL, "description" text, "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'MEDIUM', "due_date" date, "position" integer NOT NULL DEFAULT '0', "deleted_by_id" uuid, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_tasks_deleted_at" ON "tasks" ("deleted_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_tasks_column_position" ON "tasks" ("column_id", "position") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_tasks_due_date" ON "tasks" ("due_date") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_tasks_priority" ON "tasks" ("priority") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_tasks_creator_id" ON "tasks" ("creator_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_tasks_assignee_id" ON "tasks" ("assignee_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_tasks_column_id" ON "tasks" ("column_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_tasks_project_id" ON "tasks" ("project_id") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."time_entries_entry_type_enum" AS ENUM('TIMER', 'MANUAL')`,
        );
        await queryRunner.query(
            `CREATE TABLE "time_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "task_id" uuid NOT NULL, "user_id" uuid NOT NULL, "entry_type" "public"."time_entries_entry_type_enum" NOT NULL, "duration_minutes" integer NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE, "ended_at" TIMESTAMP WITH TIME ZONE, "description" character varying(500), CONSTRAINT "PK_b8bc5f10269ba2fe88708904aa0" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_time_entries_created_at" ON "time_entries" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_time_entries_user_id" ON "time_entries" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_time_entries_task_id" ON "time_entries" ("task_id") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."notifications_type_enum" AS ENUM('TASK_ASSIGNED', 'DUE_DATE_REMINDER', 'STATUS_CHANGE', 'COMMENT_MENTION', 'NEW_COMMENT', 'INVITATION')`,
        );
        await queryRunner.query(
            `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "task_id" uuid, "project_id" uuid, "is_read" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_notifications_user_created_at" ON "notifications" ("user_id", "created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_notifications_user_is_read" ON "notifications" ("user_id", "is_read") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "token" character varying(512) NOT NULL, "user_agent" character varying(500), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token") `,
        );
        await queryRunner.query(
            `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_password_reset_tokens_expires_at" ON "password_reset_tokens" ("expires_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_password_reset_tokens_token_hash" ON "password_reset_tokens" ("token_hash") `,
        );
        await queryRunner.query(
            `CREATE TABLE "email_verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_email_verification_tokens_expires_at" ON "email_verification_tokens" ("expires_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_email_verification_tokens_user_id" ON "email_verification_tokens" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_email_verification_tokens_token_hash" ON "email_verification_tokens" ("token_hash") `,
        );
        await queryRunner.query(
            `CREATE TABLE "system_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "key" character varying(100) NOT NULL, "value" jsonb NOT NULL, "description" character varying(500), "updated_by_id" uuid, CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d" UNIQUE ("key"), CONSTRAINT "PK_82521f08790d248b2a80cc85d40" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_system_settings_key" ON "system_settings" ("key") `,
        );
        await queryRunner.query(
            `CREATE TABLE "task_labels" ("task_id" uuid NOT NULL, "label_id" uuid NOT NULL, CONSTRAINT "PK_d46d4e476e3f6f8bf272b2bc1eb" PRIMARY KEY ("task_id", "label_id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_844df22351eb86c33c3e8c132f" ON "task_labels" ("task_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_09dd3f6f9d04063726c498155f" ON "task_labels" ("label_id") `,
        );
        await queryRunner.query(
            `ALTER TABLE "user_devices" ADD CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "project_members" ADD CONSTRAINT "FK_b5729113570c20c7e214cf3f58d" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "project_members" ADD CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "columns" ADD CONSTRAINT "FK_ad83764ca1d841f43830f93b787" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "labels" ADD CONSTRAINT "FK_68b0da461f6765824f6db642f12" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "invitations" ADD CONSTRAINT "FK_1462d5db7be95ebcafc9fcdf2e1" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "invitations" ADD CONSTRAINT "FK_9752bd6630e9c8a1e1b046b43e7" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_3baa1aae6f896f72eafbdd057e9" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_300e98d0bf7b02d33e952ad0508" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_d54f841fa5478e4734590d44036" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "projects" ADD CONSTRAINT "FK_b1bd2fbf5d0ef67319c91acb5cf" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "sub_tasks" ADD CONSTRAINT "FK_be4002db4cc6e2d20577f48ddf3" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "comments" ADD CONSTRAINT "FK_18c2493067c11f44efb35ca0e03" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "comments" ADD CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "comments" ADD CONSTRAINT "FK_d6f93329801a93536da4241e386" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "attachments" ADD CONSTRAINT "FK_e62fd181b97caa6b150b09220b1" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "attachments" ADD CONSTRAINT "FK_73407cf2d2a0e64546bacf309a7" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" ADD CONSTRAINT "FK_986f14173dba32448f3f3abb1c4" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" ADD CONSTRAINT "FK_f4cb489461bc751498a28852356" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" ADD CONSTRAINT "FK_855d484825b715c545349212c7f" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" ADD CONSTRAINT "FK_1f6c38bfb17f641fbe3c451ba84" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "time_entries" ADD CONSTRAINT "FK_104aa11ede7c8d5afbbe1fdbb24" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "time_entries" ADD CONSTRAINT "FK_f16c3c269283ee42429d09d693d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_b4a7cd30c9f4ca1b23ef0eb6dd8" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_95464140d7dc04d7efb0afd6be0" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_fdcb77f72f529bf65c95d72a147" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "system_settings" ADD CONSTRAINT "FK_ec0d9094a4e3bcd97ab4cb636d9" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_844df22351eb86c33c3e8c132f4" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_09dd3f6f9d04063726c498155f2" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_09dd3f6f9d04063726c498155f2"`,
        );
        await queryRunner.query(
            `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_844df22351eb86c33c3e8c132f4"`,
        );
        await queryRunner.query(
            `ALTER TABLE "system_settings" DROP CONSTRAINT "FK_ec0d9094a4e3bcd97ab4cb636d9"`,
        );
        await queryRunner.query(
            `ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_fdcb77f72f529bf65c95d72a147"`,
        );
        await queryRunner.query(
            `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`,
        );
        await queryRunner.query(
            `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_95464140d7dc04d7efb0afd6be0"`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_b4a7cd30c9f4ca1b23ef0eb6dd8"`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
        );
        await queryRunner.query(
            `ALTER TABLE "time_entries" DROP CONSTRAINT "FK_f16c3c269283ee42429d09d693d"`,
        );
        await queryRunner.query(
            `ALTER TABLE "time_entries" DROP CONSTRAINT "FK_104aa11ede7c8d5afbbe1fdbb24"`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" DROP CONSTRAINT "FK_1f6c38bfb17f641fbe3c451ba84"`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" DROP CONSTRAINT "FK_855d484825b715c545349212c7f"`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" DROP CONSTRAINT "FK_f4cb489461bc751498a28852356"`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" DROP CONSTRAINT "FK_986f14173dba32448f3f3abb1c4"`,
        );
        await queryRunner.query(
            `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"`,
        );
        await queryRunner.query(
            `ALTER TABLE "attachments" DROP CONSTRAINT "FK_73407cf2d2a0e64546bacf309a7"`,
        );
        await queryRunner.query(
            `ALTER TABLE "attachments" DROP CONSTRAINT "FK_e62fd181b97caa6b150b09220b1"`,
        );
        await queryRunner.query(
            `ALTER TABLE "comments" DROP CONSTRAINT "FK_d6f93329801a93536da4241e386"`,
        );
        await queryRunner.query(
            `ALTER TABLE "comments" DROP CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d"`,
        );
        await queryRunner.query(
            `ALTER TABLE "comments" DROP CONSTRAINT "FK_18c2493067c11f44efb35ca0e03"`,
        );
        await queryRunner.query(
            `ALTER TABLE "sub_tasks" DROP CONSTRAINT "FK_be4002db4cc6e2d20577f48ddf3"`,
        );
        await queryRunner.query(
            `ALTER TABLE "projects" DROP CONSTRAINT "FK_b1bd2fbf5d0ef67319c91acb5cf"`,
        );
        await queryRunner.query(
            `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_d54f841fa5478e4734590d44036"`,
        );
        await queryRunner.query(
            `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_300e98d0bf7b02d33e952ad0508"`,
        );
        await queryRunner.query(
            `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_3baa1aae6f896f72eafbdd057e9"`,
        );
        await queryRunner.query(
            `ALTER TABLE "invitations" DROP CONSTRAINT "FK_9752bd6630e9c8a1e1b046b43e7"`,
        );
        await queryRunner.query(
            `ALTER TABLE "invitations" DROP CONSTRAINT "FK_1462d5db7be95ebcafc9fcdf2e1"`,
        );
        await queryRunner.query(
            `ALTER TABLE "labels" DROP CONSTRAINT "FK_68b0da461f6765824f6db642f12"`,
        );
        await queryRunner.query(
            `ALTER TABLE "columns" DROP CONSTRAINT "FK_ad83764ca1d841f43830f93b787"`,
        );
        await queryRunner.query(
            `ALTER TABLE "project_members" DROP CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8"`,
        );
        await queryRunner.query(
            `ALTER TABLE "project_members" DROP CONSTRAINT "FK_b5729113570c20c7e214cf3f58d"`,
        );
        await queryRunner.query(
            `ALTER TABLE "user_devices" DROP CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_09dd3f6f9d04063726c498155f"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_844df22351eb86c33c3e8c132f"`,
        );
        await queryRunner.query(`DROP TABLE "task_labels"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_system_settings_key"`,
        );
        await queryRunner.query(`DROP TABLE "system_settings"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_email_verification_tokens_token_hash"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_email_verification_tokens_user_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_email_verification_tokens_expires_at"`,
        );
        await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_password_reset_tokens_token_hash"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_password_reset_tokens_user_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_password_reset_tokens_expires_at"`,
        );
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_refresh_tokens_token"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_refresh_tokens_user_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_refresh_tokens_expires_at"`,
        );
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_notifications_user_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_notifications_user_is_read"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_notifications_user_created_at"`,
        );
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_time_entries_task_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_time_entries_user_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_time_entries_created_at"`,
        );
        await queryRunner.query(`DROP TABLE "time_entries"`);
        await queryRunner.query(
            `DROP TYPE "public"."time_entries_entry_type_enum"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_project_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_column_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_assignee_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_creator_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_priority"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_due_date"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_tasks_column_position"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_deleted_at"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_attachments_task_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_attachments_uploader_id"`,
        );
        await queryRunner.query(`DROP TABLE "attachments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_task_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_parent_id"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_comments_task_created_at"`,
        );
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sub_tasks_task_id"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_sub_tasks_task_position"`,
        );
        await queryRunner.query(`DROP TABLE "sub_tasks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_projects_owner_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_projects_status"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_projects_created_at"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_projects_deadline"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TYPE "public"."projects_template_enum"`);
        await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_activity_logs_project_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_activity_logs_task_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_activity_logs_user_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_activity_logs_project_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_activity_logs_created_at"`,
        );
        await queryRunner.query(`DROP TABLE "activity_logs"`);
        await queryRunner.query(
            `DROP TYPE "public"."activity_logs_action_enum"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_invitations_token"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_invitations_project_id"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_invitations_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invitations_status"`);
        await queryRunner.query(`DROP TABLE "invitations"`);
        await queryRunner.query(`DROP TYPE "public"."invitations_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_labels_project_id"`);
        await queryRunner.query(`DROP TABLE "labels"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_columns_project_id"`);
        await queryRunner.query(`DROP TABLE "columns"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_project_members_project_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_project_members_user_id"`,
        );
        await queryRunner.query(`DROP TABLE "project_members"`);
        await queryRunner.query(
            `DROP TYPE "public"."project_members_project_role_enum"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_user_devices_token"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_user_devices_user_id"`,
        );
        await queryRunner.query(`DROP TABLE "user_devices"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_google_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(
            `DROP TYPE "public"."users_digest_frequency_enum"`,
        );
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
}
