import { logger } from './utils/logger';
import { AMQP } from './lib/AMQP';

logger.info('Starting...');

const amqp = new AMQP(true);

process.on('SIGINT', async () => {
  logger.info('Closing....');
  await amqp.disconnect();
  logger.info('Closed');
  process.exit();
});
