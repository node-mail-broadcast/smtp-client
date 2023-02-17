import {
  Configuration,
  DefaultApi,
} from '@node-mail-broadcast/node-mailer-ts-api';
import config from '../config/config';
import { logger } from '../utils/logger';

export const API_CONFIG = new Configuration({
  basePath: config.get('apiurl'),
});

export async function getApiVersion() {
  return (await new DefaultApi(API_CONFIG).getVersion()).data;
}

getApiVersion().then(
  (x) => logger.info(`Used API Version: ${x.data.version}`),
  (x) => logger.error(`Error while fetching API Version: ${x}`)
);
