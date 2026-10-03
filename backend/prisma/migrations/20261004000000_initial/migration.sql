-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'email',
    "auth_provider_id" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" VARCHAR(50) NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "client_id" UUID,
    "goal_text" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "target_duration_seconds" INTEGER NOT NULL,
    "actual_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "distraction_attempts" INTEGER NOT NULL DEFAULT 0,
    "quiz_score" INTEGER NOT NULL DEFAULT 0,
    "total_quiz_questions" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "apps_blocked" JSONB NOT NULL DEFAULT '[]',
    "documents" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_bank" (
    "id" UUID NOT NULL,
    "topic_id" TEXT NOT NULL,
    "owner_id" UUID,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT NOT NULL DEFAULT 'static',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_sessions" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_index" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_auth_provider_id_key" ON "users"("auth_provider", "auth_provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_created_at_idx" ON "study_sessions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "study_sessions_topic_id_idx" ON "study_sessions"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_sessions_user_id_client_id_key" ON "study_sessions"("user_id", "client_id");

-- CreateIndex
CREATE INDEX "quiz_bank_topic_id_difficulty_idx" ON "quiz_bank"("topic_id", "difficulty");

-- CreateIndex
CREATE INDEX "quiz_sessions_question_id_idx" ON "quiz_sessions"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_sessions_session_id_question_id_key" ON "quiz_sessions"("session_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storage_key_key" ON "documents"("storage_key");

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_bank" ADD CONSTRAINT "quiz_bank_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_bank" ADD CONSTRAINT "quiz_bank_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Database constraints also protect writes outside the API.
ALTER TABLE study_sessions ADD CONSTRAINT session_duration CHECK (target_duration_seconds BETWEEN 60 AND 72000 AND actual_duration_seconds BETWEEN 0 AND target_duration_seconds);
ALTER TABLE study_sessions ADD CONSTRAINT session_completion CHECK (NOT is_completed OR actual_duration_seconds = target_duration_seconds);
ALTER TABLE study_sessions ADD CONSTRAINT session_score CHECK (total_quiz_questions BETWEEN 0 AND 50 AND quiz_score BETWEEN 0 AND total_quiz_questions);
ALTER TABLE study_sessions ADD CONSTRAINT session_distractions CHECK (distraction_attempts BETWEEN 0 AND 10000);
ALTER TABLE quiz_bank ADD CONSTRAINT question_index CHECK (correct_index BETWEEN 0 AND 3);
ALTER TABLE quiz_bank ADD CONSTRAINT question_options CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4);
ALTER TABLE quiz_bank ADD CONSTRAINT question_difficulty CHECK (difficulty IN ('easy','medium','hard'));
ALTER TABLE quiz_sessions ADD CONSTRAINT answer_index CHECK (selected_index BETWEEN 0 AND 3);
