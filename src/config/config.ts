import * as convict from 'convict';
import * as path from 'path';
import * as fs from 'fs';

// Define Config schema
const config = convict({
  loglevel: {
    doc: 'The application loglevel.',
    format: String,
    default: 'info',
    env: 'LOGLEVEL',
  },
  rabbitmq: {
    ip: {
      doc: 'The IP address rabbitmq should connect to',
      format: String,
      default: '127.0.0.1',
      env: 'RABBIT_IP',
    },
    port: {
      doc: 'The Port rabbitmq should connect to',
      format: 'port',
      default: '5672',
      env: 'RABBIT_PORT',
    },
    queue: {
      doc: 'The queue which rabbitmq emails are sent with',
      format: String,
      default: 'emails',
      env: 'RABBIT_QUEUE',
    },
  },
  redis: {
    ip: {
      doc: 'The IP address Redis should connect to',
      format: String,
      default: '127.0.0.1',
      env: 'REDIS_IP',
    },
    port: {
      doc: 'The Port Redis should connect to',
      format: 'port',
      default: '6379',
      env: 'REDIS_PORT',
    },
    password: {
      doc: 'The Password for Redis',
      format: String,
      default: 'secret',
      env: 'REDIS_PASSWORD',
    },
  },
  apiurl: {
    doc: 'The API endpoint url for the mail-rest-api service',
    format: String,
    default: '',
    env: 'APIURL',
  },
  authkey: {
    doc: 'The auth key for the mail-rest-api service',
    format: String,
    default: '',
    env: 'AUTHKEY',
  },
  config: {
    doc: 'Location of Config File',
    format: String,
    default: path.join(__dirname, '..', '..', 'config.json'),
    env: 'CONFIG_FILE',
  },
});

//Load Config json File based on default or Environment Variable
if (fs.existsSync(config.get('config'))) {
  config.loadFile(config.get('config'));
}

//Validate Config Parameter
//
config.validate({ strict: true });
export default config;
