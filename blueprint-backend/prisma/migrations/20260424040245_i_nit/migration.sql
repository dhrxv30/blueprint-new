-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "clickupToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrdVersion" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileUrl" TEXT,
    "parsedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrdVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineAnalysis" (
    "id" UUID NOT NULL,
    "prdVersionId" UUID NOT NULL,
    "features" JSONB NOT NULL DEFAULT '[]',
    "stories" JSONB NOT NULL DEFAULT '[]',
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "sprints" JSONB NOT NULL DEFAULT '[]',
    "architecture" TEXT,
    "codeStructure" JSONB NOT NULL DEFAULT '[]',
    "tests" JSONB NOT NULL DEFAULT '[]',
    "traceability" JSONB NOT NULL DEFAULT '{}',
    "ambiguities" JSONB NOT NULL DEFAULT '[]',
    "clarifications" JSONB NOT NULL DEFAULT '[]',
    "healthScore" JSONB NOT NULL DEFAULT '{}',
    "devops" JSONB NOT NULL DEFAULT '{}',
    "changeImpact" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineJob" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStageRun" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "stageName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PipelineStageRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineArtifact" (
    "id" UUID NOT NULL,
    "stageRunId" UUID NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "PipelineArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubConnection" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "accessToken" TEXT NOT NULL,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubRepoMapping" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "githubConnectionId" UUID NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "webhookId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubRepoMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineAnalysis_prdVersionId_key" ON "PipelineAnalysis"("prdVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubConnection_profileId_key" ON "GitHubConnection"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepoMapping_projectId_key" ON "GitHubRepoMapping"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepoMapping_fullName_key" ON "GitHubRepoMapping"("fullName");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrdVersion" ADD CONSTRAINT "PrdVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineAnalysis" ADD CONSTRAINT "PipelineAnalysis_prdVersionId_fkey" FOREIGN KEY ("prdVersionId") REFERENCES "PrdVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineJob" ADD CONSTRAINT "PipelineJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStageRun" ADD CONSTRAINT "PipelineStageRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PipelineJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_stageRunId_fkey" FOREIGN KEY ("stageRunId") REFERENCES "PipelineStageRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubConnection" ADD CONSTRAINT "GitHubConnection_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRepoMapping" ADD CONSTRAINT "GitHubRepoMapping_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRepoMapping" ADD CONSTRAINT "GitHubRepoMapping_githubConnectionId_fkey" FOREIGN KEY ("githubConnectionId") REFERENCES "GitHubConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
