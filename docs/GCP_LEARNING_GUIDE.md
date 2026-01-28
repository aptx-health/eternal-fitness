# GCP Cloud Run + Pub/Sub Learning Guide

This guide walks through the [GCP Event-Driven Cloud Run tutorial](https://docs.cloud.google.com/run/docs/tutorials/pubsub-eventdriven) with context for the Ripit Fitness program cloning use case (Issue #111).

## Why We Need This

**Problem**: Large community programs (9+ weeks) fail to clone in production because Vercel kills the background process after the API response is sent.

**Solution**: Offload cloning to GCP Cloud Run, triggered by Pub/Sub messages.

## Tutorial vs Our Implementation

| Tutorial | Our Use Case |
|----------|--------------|
| Generic Pub/Sub message handler | Program clone job processor |
| No database access | Needs Prisma + Supabase connection |
| Simple message logging | Complex nested DB operations |
| Event-driven demo | Production background job queue |

## Phase 1: Follow the Tutorial (Learning)

### ✅ Tutorial Completed - What We Actually Did

**Date completed**: 2026-01-27

**Project**: `ripit-fitness` (Project Number: 334725085515)

**What we built**: Event-driven Cloud Run function that processes Pub/Sub messages

#### Commands We Ran

```bash
# 1. Created project and set as default
gcloud projects create ripit-fitness --name="Ripit Fitness"
gcloud config set project ripit-fitness

# 2. Enabled billing via console
# https://console.cloud.google.com/billing

# 3. Enabled all required APIs
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  eventarc.googleapis.com \
  run.googleapis.com \
  logging.googleapis.com \
  pubsub.googleapis.com

# 4. Set default config values
gcloud config set run/region us-central1
gcloud config set run/platform managed
gcloud config set eventarc/location us-central1

# 5. Set up shell variables
PROJECT_ID=ripit-fitness
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT=eventarc-trigger-sa

# 6. Created service account for Eventarc
gcloud iam service-accounts create $SERVICE_ACCOUNT

# 7. Granted IAM permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/eventarc.eventReceiver"

# 8. Created hello world function
mkdir -p ~/gcp-learning/hello-pubsub
cd ~/gcp-learning/hello-pubsub
# Created index.js, package.json, Dockerfile (see below for code)

# 9. Deployed to Cloud Run
gcloud run deploy hello-pubsub \
  --source . \
  --allow-unauthenticated

# Result: https://hello-pubsub-334725085515.us-central1.run.app

# 10. Created Pub/Sub topic
gcloud pubsub topics create init-test

# 11. Created Eventarc trigger
gcloud eventarc triggers create hello-trigger \
  --location=us-central1 \
  --destination-run-service=hello-pubsub \
  --destination-run-region=us-central1 \
  --event-filters="type=google.cloud.pubsub.topic.v1.messagePublished" \
  --transport-topic=projects/$PROJECT_ID/topics/init-test \
  --service-account=$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com

# 12. Tested the flow
gcloud pubsub topics publish init-test --message="Hello from GCP!"

# 13. Viewed logs
gcloud run logs read hello-pubsub --limit=20

# ✅ SUCCESS: Message appeared in logs
```

#### What We Learned

**Cloud Run**:
- Serverless container platform (not just Node.js functions)
- Auto-scales to zero when not in use
- Requires Dockerfile to define the container
- Deployed with `--source .` (builds automatically)
- Service URL is auto-generated
- Can be public (`--allow-unauthenticated`) or private

**Pub/Sub**:
- Message queue that holds messages until processed
- Topics are named channels (e.g., `init-test`)
- Messages are base64-encoded when delivered via CloudEvents
- Very simple to publish: `gcloud pubsub topics publish <topic> --message="..."`

**Eventarc**:
- Glue that connects Pub/Sub → Cloud Run
- Triggers are separate resources from topics and functions
- Requires service account with `run.invoker` and `eventarc.eventReceiver` roles
- Filter on event type: `google.cloud.pubsub.topic.v1.messagePublished`

**Service Accounts**:
- Identity for services (like API keys but better)
- Needs explicit IAM roles granted
- Different service accounts for different purposes:
  - `eventarc-trigger-sa`: For Eventarc to invoke Cloud Run
  - Later: `vercel-pubsub-publisher`: For Next.js to publish messages

**The Flow**:
```
Publish message → Pub/Sub topic (init-test)
                      ↓
                  Eventarc trigger (hello-trigger)
                      ↓
                  Cloud Run function (hello-pubsub)
                      ↓
                  Logs show "Received message: Hello from GCP!"
```

#### Key Insights

1. **CloudEvent format**: Messages come wrapped in CloudEvent format with base64-encoded data. Always decode:
   ```javascript
   const data = Buffer.from(message.data, 'base64').toString()
   ```

2. **Async by design**: Publishing returns immediately. Processing happens in background. Perfect for our use case!

3. **No polling needed**: Eventarc automatically invokes function when messages arrive. No cron jobs or polling loops.

4. **Logs are critical**: Use `gcloud run logs read` to debug. Logs show stdout from your function.

5. **Configuration helpers**: Setting defaults (`gcloud config set`) makes subsequent commands cleaner.

6. **Project structure**: Project contains topics, service accounts, Cloud Run services, triggers - all separate resources that reference each other.

#### Files Created

**`~/gcp-learning/hello-pubsub/index.js`** - Express server that receives CloudEvents:
```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/', (req, res) => {
  const message = req.body.message;
  if (!message) {
    res.status(400).send('Bad Request: missing message');
    return;
  }

  // Decode base64 CloudEvent data
  const data = Buffer.from(message.data, 'base64').toString();
  console.log(`Received message: ${data}`);
  res.status(200).send('OK');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
```

**`~/gcp-learning/hello-pubsub/package.json`**:
```json
{
  "name": "hello-pubsub",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js" },
  "dependencies": { "express": "^4.18.2" }
}
```

**`~/gcp-learning/hello-pubsub/Dockerfile`**:
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

#### Next Steps for Production

Now that we understand the basics, we need to:
1. Create a new Cloud Run function for program cloning (`clone-program`)
2. Add Prisma and database access
3. Create production Pub/Sub topic (`program-clone-jobs`)
4. Update Next.js API to publish clone jobs
5. Create service account for Vercel to publish messages

---

### Step 1: Set Up GCP Project

```bash
# Create new project (or use existing)
gcloud projects create ripit-fitness-workers --name="Ripit Fitness Workers"

# Set default project
gcloud config set project ripit-fitness-workers

# Enable billing (required - use Cloud Console UI)
# https://console.cloud.google.com/billing
```

**What this does**: Creates isolated GCP project for your background workers.

### Step 2: Enable Required APIs

```bash
# Enable all required services
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  eventarc.googleapis.com \
  run.googleapis.com \
  logging.googleapis.com \
  pubsub.googleapis.com
```

**Why**: Each service needs explicit activation. You'll use:
- Pub/Sub: Message queue
- Cloud Run: Serverless function execution
- Eventarc: Connects Pub/Sub → Cloud Run
- Cloud Build: Builds your container
- Artifact Registry: Stores your container images

### Step 3: Create Service Account

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create cloudrun-pubsub-invoker \
  --display-name="Cloud Run Pub/Sub Invoker"

# Grant permission to invoke Cloud Run
gcloud run services add-iam-policy-binding helloworld-events \
  --member="serviceAccount:cloudrun-pubsub-invoker@ripit-fitness-workers.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=us-central1
```

**What this does**: Creates identity for Eventarc to invoke your function. Think of it like API authentication.

### Step 4: Create Hello World Function (Tutorial Example)

Create a test directory:

```bash
mkdir -p ~/gcp-learning/hello-pubsub
cd ~/gcp-learning/hello-pubsub
```

**File**: `index.js`

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/', (req, res) => {
  const message = req.body.message;

  if (!message) {
    res.status(400).send('Bad Request: missing message');
    return;
  }

  // CloudEvent data is base64-encoded
  const data = Buffer.from(message.data, 'base64').toString();

  console.log(`Received message: ${data}`);
  res.status(200).send('OK');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
```

**File**: `package.json`

```json
{
  "name": "hello-pubsub",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

**File**: `Dockerfile`

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

### Step 5: Deploy to Cloud Run

```bash
# Deploy function
gcloud run deploy helloworld-events \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --platform=managed

# Note the service URL (something like):
# https://helloworld-events-abc123-uc.a.run.app
```

**What happens**: GCP builds your container, pushes to Artifact Registry, deploys to Cloud Run.

### Step 6: Create Pub/Sub Topic

```bash
# Create topic
gcloud pubsub topics create test-events
```

**What this does**: Creates message queue. Think of it like a Redis queue or RabbitMQ topic.

### Step 7: Create Eventarc Trigger

```bash
# Link Pub/Sub topic to Cloud Run function
gcloud eventarc triggers create hello-trigger \
  --location=us-central1 \
  --destination-run-service=helloworld-events \
  --destination-run-region=us-central1 \
  --event-filters="type=google.cloud.pubsub.topic.v1.messagePublished" \
  --transport-topic=projects/ripit-fitness-workers/topics/test-events \
  --service-account=cloudrun-pubsub-invoker@ripit-fitness-workers.iam.gserviceaccount.com
```

**What this does**: Automatically invokes your Cloud Run function when messages arrive on the topic.

### Step 8: Test It

```bash
# Publish test message
gcloud pubsub topics publish test-events --message="Hello from GCP!"

# View logs
gcloud run logs read helloworld-events --region=us-central1 --limit=10
```

**Expected output**: You should see "Received message: Hello from GCP!" in logs.

## Phase 2: Adapt for Program Cloning

Now that you understand the basics, let's adapt it for your use case.

### Key Differences

1. **Database Access**: Need Supabase connection string
2. **Dependencies**: Need Prisma, @google-cloud/pubsub
3. **Message Structure**: Custom program clone job format
4. **Error Handling**: Need retry logic, status updates
5. **Authentication**: Need service account key for Pub/Sub publishing from Vercel

### Architecture

```
┌─────────────────────┐
│  Next.js API        │
│  (Vercel)           │
│                     │
│  POST /api/clone    │
└──────────┬──────────┘
           │
           │ 1. Create shell program (copyStatus: 'cloning')
           │ 2. Publish message to Pub/Sub
           │ 3. Return programId immediately
           │
           ▼
┌─────────────────────┐
│  GCP Pub/Sub Topic  │
│  program-clone-jobs │
└──────────┬──────────┘
           │
           │ Eventarc trigger
           │
           ▼
┌─────────────────────┐
│  Cloud Run Function │
│  clone-program      │
│                     │
│  1. Decode message  │
│  2. Clone weeks     │
│  3. Update status   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase Database  │
│  (PostgreSQL)       │
└─────────────────────┘
```

### Step 1: Create Program Clone Function

Create new directory:

```bash
mkdir -p ~/repos/fitcsv/cloud-functions/clone-program
cd ~/repos/fitcsv/cloud-functions/clone-program
```

**File**: `package.json`

```json
{
  "name": "clone-program-worker",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@prisma/client": "^6.19.0",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "prisma": "^6.19.0",
    "typescript": "^5.3.3"
  }
}
```

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**File**: `src/index.ts`

```typescript
import express from 'express'
import { PrismaClient } from '@prisma/client'

const app = express()
app.use(express.json())

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

interface ProgramCloneJob {
  programId: string
  userId: string
  programData: any
  programType: 'strength' | 'cardio'
}

app.post('/', async (req, res) => {
  const message = req.body.message

  if (!message) {
    res.status(400).send('Bad Request: missing message')
    return
  }

  try {
    // Decode CloudEvent message
    const data = Buffer.from(message.data, 'base64').toString()
    const job: ProgramCloneJob = JSON.parse(data)

    console.log(`Processing clone job: ${job.programId}`)

    // TODO: Import and call your actual cloning logic
    // await cloneStrengthProgramData(prisma, job.programId, job.programData, job.userId)

    // For now, just update status
    await prisma.program.update({
      where: { id: job.programId },
      data: { copyStatus: 'ready' },
    })

    console.log(`Clone job completed: ${job.programId}`)
    res.status(200).send('OK')
  } catch (error) {
    console.error('Clone job failed:', error)
    // Don't throw - let it retry via Pub/Sub dead-letter
    await prisma.program.update({
      where: { id: (req.body as any).programId },
      data: { copyStatus: 'failed' },
    })
    res.status(500).send('Error processing job')
  }
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Clone worker listening on port ${port}`)
})
```

**File**: `Dockerfile`

```dockerfile
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --production

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

CMD ["npm", "start"]
```

**File**: `prisma/schema.prisma`

Copy your existing schema from `/Users/dustin/repos/fitcsv/prisma/schema.prisma` here.

### Step 2: Deploy Clone Function

```bash
cd ~/repos/fitcsv/cloud-functions/clone-program

# Build and deploy
gcloud run deploy clone-program \
  --source . \
  --region=us-central1 \
  --platform=managed \
  --timeout=540s \
  --memory=1Gi \
  --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
  --no-allow-unauthenticated
```

**Important**: Replace `${DATABASE_URL}` with your actual Supabase connection string.

### Step 3: Create Pub/Sub Topic for Production

```bash
# Create production topic
gcloud pubsub topics create program-clone-jobs

# Create Eventarc trigger
gcloud eventarc triggers create program-clone-trigger \
  --location=us-central1 \
  --destination-run-service=clone-program \
  --destination-run-region=us-central1 \
  --event-filters="type=google.cloud.pubsub.topic.v1.messagePublished" \
  --transport-topic=projects/ripit-fitness-workers/topics/program-clone-jobs \
  --service-account=cloudrun-pubsub-invoker@ripit-fitness-workers.iam.gserviceaccount.com
```

### Step 4: Update Next.js API to Publish Messages

In your Next.js app:

```bash
cd ~/repos/fitcsv
npm install @google-cloud/pubsub
```

**New file**: `lib/gcp/pubsub.ts`

```typescript
import { PubSub } from '@google-cloud/pubsub'

const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY || '{}'),
})

export interface ProgramCloneJob {
  programId: string
  userId: string
  programData: any
  programType: 'strength' | 'cardio'
}

export async function publishProgramCloneJob(job: ProgramCloneJob) {
  const topic = pubsub.topic('program-clone-jobs')
  const messageBuffer = Buffer.from(JSON.stringify(job))

  const messageId = await topic.publishMessage({ data: messageBuffer })
  console.log(`Published clone job: ${messageId}`)

  return messageId
}
```

**Update**: `lib/community/cloning.ts`

```typescript
import { publishProgramCloneJob } from '@/lib/gcp/pubsub'

// Replace fire-and-forget with Pub/Sub publish
async function cloneStrengthProgram(
  prisma: PrismaClient,
  communityProgram: any,
  userId: string
): Promise<CloneResult> {
  // ... create shell program ...

  // Publish to Pub/Sub instead of fire-and-forget
  await publishProgramCloneJob({
    programId: shellProgram.id,
    userId: userId,
    programData: programData,
    programType: 'strength',
  })

  return {
    success: true,
    programId: shellProgram.id,
  }
}
```

### Step 5: Set Up Service Account for Vercel

Your Next.js app needs permission to publish to Pub/Sub:

```bash
# Create service account for Vercel
gcloud iam service-accounts create vercel-pubsub-publisher \
  --display-name="Vercel Pub/Sub Publisher"

# Grant publish permission
gcloud pubsub topics add-iam-policy-binding program-clone-jobs \
  --member="serviceAccount:vercel-pubsub-publisher@ripit-fitness-workers.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

# Create key (downloads JSON)
gcloud iam service-accounts keys create ~/vercel-key.json \
  --iam-account=vercel-pubsub-publisher@ripit-fitness-workers.iam.gserviceaccount.com
```

**Add to Doppler and Vercel:**
- `GCP_PROJECT_ID`: `ripit-fitness-workers`
- `GCP_SERVICE_ACCOUNT_KEY`: Contents of `~/vercel-key.json` (as JSON string)

### Step 6: Test End-to-End

1. **Local testing** (use emulator):
```bash
gcloud beta emulators pubsub start --project=test-project
export PUBSUB_EMULATOR_HOST=localhost:8085
doppler run -- npm run dev
```

2. **Production testing**:
```bash
# Deploy Next.js to Vercel
# Clone a program via UI
# Check Cloud Run logs
gcloud run logs read clone-program --region=us-central1 --limit=50
```

## Common Issues & Solutions

### Issue: "Permission denied to publish"
**Solution**: Check service account has `pubsub.publisher` role

### Issue: "Cloud Run function timeout"
**Solution**: Increase timeout in deploy command (`--timeout=540s`)

### Issue: "Database connection failed"
**Solution**: Use Supabase connection pooler URL, not direct connection

### Issue: "Message not triggering function"
**Solution**: Check Eventarc trigger is created and service account has `run.invoker` role

## Cost Estimates

**Free tier includes:**
- Pub/Sub: 10GB messages/month
- Cloud Run: 2M requests/month, 360,000 GB-seconds
- Likely $0/month for your use case (unless you have massive traffic)

## Next Steps

1. Complete tutorial with hello world example
2. Deploy clone-program function with real logic
3. Test with small program first
4. Monitor logs and fix issues
5. Test with large 9+ week program
6. Set up monitoring and alerts

## Local Pub/Sub Emulator Testing (COMPLETED)

**Date completed**: 2026-01-27

Successfully set up local Pub/Sub emulator for integration testing with Vitest.

### Setup Steps

1. **Install Java (required for emulator)**:
   ```bash
   brew install openjdk
   echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Install Pub/Sub emulator**:
   ```bash
   gcloud components install pubsub-emulator
   ```

3. **Install Node.js client library**:
   ```bash
   npm install --save-dev @google-cloud/pubsub
   ```

4. **Add to Doppler `dev_test` config**:
   ```bash
   doppler secrets set PUBSUB_EMULATOR_HOST="localhost:8085" --config dev_test
   doppler secrets set PUBSUB_PROJECT_ID="test-project" --config dev_test
   ```

### Running Tests

**Terminal 1 - Start emulator**:
```bash
gcloud beta emulators pubsub start --project=test-project --host-port=localhost:8085
```

**Terminal 2 - Run tests**:
```bash
doppler run --config dev_test -- npx vitest run __tests__/pubsub-emulator.test.ts
```

### Critical Issue: Vitest Environment

**Problem**: Tests failed with "Could not load the default credentials" even though environment variables were set correctly.

**Root cause**: Vitest was configured to use `environment: 'jsdom'` (browser-like environment), but `@google-cloud/pubsub` is a Node.js library that requires real Node.js APIs.

**Solution**: Add `@vitest-environment node` comment at the top of Pub/Sub test files:

```typescript
/**
 * @vitest-environment node
 */

process.env.PUBSUB_EMULATOR_HOST = 'localhost:8085';
process.env.PUBSUB_PROJECT_ID = 'test-project';

import { describe, it, expect } from 'vitest';
import { PubSub } from '@google-cloud/pubsub';

describe('Pub/Sub Emulator Tests', () => {
  it('should work', async () => {
    const pubsub = new PubSub({ projectId: 'test-project' });
    // ... test code
  });
});
```

**Key learnings**:
- The `@google-cloud/pubsub` library automatically detects `PUBSUB_EMULATOR_HOST` and uses the emulator
- No credentials needed for emulator - it bypasses authentication entirely
- Must use Node.js environment in Vitest, not jsdom
- Setting env vars at the top of test file (before imports) ensures they're available when the library initializes

### Test File Location

- `__tests__/pubsub-emulator.test.ts` - Hello world emulator test
- `lib/test/pubsub.ts` - Helper functions for Pub/Sub testing (optional)

## Resources

- [GCP Pub/Sub Best Practices](https://cloud.google.com/pubsub/docs/publisher)
- [Cloud Run Timeout Limits](https://cloud.google.com/run/docs/configuring/request-timeout)
- [Prisma in Cloud Run](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-gcp-cloud-run)
- [Pub/Sub Emulator Documentation](https://cloud.google.com/pubsub/docs/emulator)
