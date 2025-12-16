const { Worker } = require('bullmq');
require('dotenv').config();

const redisOptions = {
  host: process.env.REDIS_HOST || 'redis',
  port: 6379
};

console.log('Worker started, listening for jobs...');

const worker = new Worker('database-ops', async job => {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  
  if (job.name === 'backup_database') {
    // Simulate backup delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Backup completed successfully.');
    return { size: '1024MB', timestamp: new Date() };
  }

  if (job.name === 'reindex_table') {
     console.log(`Reindexing table ${job.data.table}...`);
     return { status: 'complete' };
  }

}, { connection: redisOptions });

worker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});