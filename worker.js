const connectDB = require('./src/config/db');
const worker = require('./src/workers/eventWorker');

connectDB().then(() => {
  console.log('✅ Worker connected to MongoDB');
  console.log(`🔄 Worker listening to eventQueue (Worker ID: ${worker.id})`);
}).catch(err => {
  console.error('❌ Worker failed to connect to DB:', err);
  process.exit(1);
});