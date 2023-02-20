import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { IJson } from '../interfaces/IJson';
import * as amqp from 'amqp-connection-manager';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import config from '../config/config';
import { PrepareTemplate } from './PrepareTemplate';
import Mailer from './Mailer';
import { logger } from '../utils/logger';
import { amqpPackageSchema } from '../joi/amqpPackage';

/**
 * @author Nico Wagner
 * @version 1.0.0
 * @class AMQP
 * Connects to the AMQP Server and listens for new messages
 */
export class AMQP {
  private queue: string;
  private connection: AmqpConnectionManager;
  private channel: ConfirmChannel;
  private mailer: Mailer;

  constructor(connect = true) {
    if (connect) this.connect();
    this.mailer = new Mailer('');
  }

  /**
   * Connect to the amqp server and initialize connection
   * wrapper function for Creating channel ad asserting to queue
   * @async
   * @return Promise
   * @author Nico Wagner
   * @version 1.0.0
   * @since 0.2.0 04.07.2021
   */
  async connect() {
    this.queue = config.get('rabbitmq.queue');
    this.connection = amqp.connect([
      `amqp://${config.get('rabbitmq.ip')}:${config.get('rabbitmq.port')}`,
    ]);
    logger.info('Created Connection');
    const channel = await this.createChannelAndAssertQueue();
    logger.info('crated Channel and asserted Queue');
    this.channel = channel;
    //add consumeHandler
    await this.channel.consume(this.queue, (msg) => this.consumeHandler(msg));
  }

  async disconnect() {
    await this.connection.close();
  }

  /**
   * This function converts the message buffer to a json object checks for a valid json
   * @param {ConsumeMessage} msg - MSG obj from amqp event
   * @author Nico
   * @version 1
   * @since 24.06.2021 00:01:20
   */
  private parseMessage(msg: ConsumeMessage | null) {
    if (msg === null) return null;
    const content = msg.content.toString('utf-8');
    try {
      const json: IJson = JSON.parse(content);
      const valRes = amqpPackageSchema.tailor('create').validate(json);
      if (valRes.error) {
        console.log(valRes);
        throw new Error('Invalid JSON given, missing properties.');
      }
      return valRes.value;
    } catch (e) {
      logger.error('Invalid MSG JSON;', e);
      return false;
    }
  }

  /**
   * This function actually creates the channel and asserts to the queue
   * @return ConfirmChannel - as **Promise**
   * @author Nico Wagner
   * @async
   * @version 1.0.0
   * @since 0.0.2 04.07.2021
   */
  createChannelAndAssertQueue(): Promise<ConfirmChannel> {
    return new Promise((resolve) => {
      this.connection.createChannel({
        setup: (channel: ConfirmChannel) => {
          channel.assertQueue(this.queue).then((_e) => {
            resolve(channel);
          });
        },
      });
    });
  }

  /**
   * Using the amqp data packet and sending the email
   * - Main Handler for the email client
   * - getting template, replacing placeholder and finally sending email
   * @param {ConsumeMessage | null } msg The Message from the amqp channel
   * @author Nico Wagner
   * @version 1.0.0
   * @since 0.0.2 04.07.2021
   */
  consumeHandler(msg: ConsumeMessage | null) {
    const json = this.parseMessage(msg);
    logger.silly(`MSG: ${JSON.stringify(msg)}`);
    if (json && msg !== null) {
      logger.debug(JSON.stringify(json));
      logger.debug('SENDING EMAIL');
      //send EMAIL
      const z = new PrepareTemplate();
      z.getTemplateForSending(json)
        .then((result) => {
          this.mailer
            .send(result, json.address)
            .then((SentMessageInfo) => {
              logger.debug(SentMessageInfo as string);
              this.channel.ack(msg);
            })
            .catch((error) => {
              logger.error(error);
              if (error === 'incorrect email') {
                logger.debug('Incorrect Email provided, cannot send email');
                this.channel.ack(msg);
              }
              if (error.errorCode) {
                //if error while email send, nack message from rabbitmq
                this.channel.nack(msg);
              }
            });
        })
        .catch((error) => {
          //this.channel.nack(msg)
          logger.error(error);
          //todo move to error queue instead of ack
          this.channel.ack(msg);
        });
    } else if (json === false) {
      logger.warn(
        "Incorrect JSON package format, can't send email but also ack message"
      );
      this.channel.ack(msg!);
    }
  }
}
