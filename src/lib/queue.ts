import { Queue, Worker, Job } from 'bullmq';
import { redis } from './redis';
import { processInvoiceJob, processBatchInvoicesJob } from './invoiceProcessor';
import { sendWebhookJob } from './webhook';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const QUEUE_NAME = 'integration-jobs';

const globalForQueue = global as unknown as { integrationQueue: Queue };

export const integrationQueue =
    globalForQueue.integrationQueue ||
    new Queue(QUEUE_NAME, {
        connection: redis as any,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        },
    });

if (process.env.NODE_ENV !== 'production') {
    globalForQueue.integrationQueue = integrationQueue;
}

const globalForWorker = global as unknown as { worker: Worker };

if (!globalForWorker.worker) {
    globalForWorker.worker = new Worker(
        QUEUE_NAME,
        async (job: Job) => {
            console.log(`Processing job ${job.name} (ID: ${job.id})...`);
            try {
                if (job.name === 'process-invoice') {
                    return await processInvoiceJob(job.data);
                }
                if (job.name === 'process-batch-invoices') {
                    return await processBatchInvoicesJob(job.data);
                }
                if (job.name === 'process-webhook') {
                    return await sendWebhookJob(job.data);
                }
            } catch (error) {
                console.error(`Error processing job ${job.id}:`, error);
                throw error;
            }
        },
        { connection: redis as any }
    );

    globalForWorker.worker.on('failed', async (job, err) => {
        console.error(`Job ${job?.id} failed with error ${err.message}`);
        // Optionally log this back to integration logs
        if (job?.name === 'process-webhook' && job.data) {
            await prisma.integrationLog.create({
                data: {
                    system: 'Webhook Outbound',
                    endpoint: job.data.url,
                    status: 'FAILED',
                    requestData: JSON.stringify(job.data.payload),
                    errorMessage: `Attempt ${job.attemptsMade}: ${err.message}`, // BullMQ will retry due to exponential backoff config in queue
                    tenantId: job.data.tenantId,
                }
            });
        }
    });

    globalForWorker.worker.on('completed', async (job) => {
        console.log(`Job ${job.id} completed successfully`);
        if (job?.name === 'process-webhook' && job.data) {
            await prisma.integrationLog.create({
                data: {
                    system: 'Webhook Outbound',
                    endpoint: job.data.url,
                    status: 'SUCCESS',
                    requestData: JSON.stringify(job.data.payload),
                    responseData: JSON.stringify(job.returnvalue),
                    tenantId: job.data.tenantId,
                }
            });
        }
    });
}

export const worker = globalForWorker.worker;
