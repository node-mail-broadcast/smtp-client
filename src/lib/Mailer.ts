import * as nodemailer from 'nodemailer';
import * as emailvalidator from 'email-validator';
import * as Mail from 'nodemailer/lib/mailer';
import { Options } from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer';
import { logger } from '../utils/logger';
import {
  SmtpServerApi,
  Template,
} from '@node-mail-broadcast/node-mailer-ts-api';
import { API_CONFIG } from './Api';

/**
 * @author Nico Wagner
 * @version 1.0.0
 * @since 0.1.0 21.07.2021
 */
class Mailer {
  private smtpServerApi: SmtpServerApi;

  constructor(_jwt: string) {
    this.smtpServerApi = new SmtpServerApi(API_CONFIG);
  }

  /**
   * This function creates the nodemailer transporter object out of the given DB object
   * @todo need smtp server tags support
   * @private
   * @return Promise
   * @version 1.0.0
   * @since 0.1.0 21.07.2021
   * @author Nico Wagner
   */
  private createNodeMailerObj(
    smtpServerTags: string[]
  ): Promise<Mail<SentMessageInfo>> {
    return new Promise((resolve, reject) => {
      this.smtpServerApi
        .getServer({ tags: smtpServerTags })
        .then((obj) => {
          const dataObj = obj.data.data[0];
          if (!dataObj) reject('No SMTP Server found');
          console.log(dataObj);
          logger.debug(
            `Creating Node Mailer Transport with: ${dataObj.host} ${dataObj.username} ${dataObj.port}`
          );
          const transporter = nodemailer.createTransport({
            from: dataObj.username,
            host: dataObj.host,
            port: dataObj.port,
            secure: dataObj.secure,
            auth: {
              user: dataObj.username,
              pass: dataObj.password,
            },
          });
          resolve(transporter);
        })
        .catch(reject);
    });
  }

  /**
   * This function prepares the nodemailer transporter and checks if the email is valid, then it passes the data
   * to the `nodeMailerSend` function, which finally sends the email
   * @author Nico Wagner
   * @param {EmailTemplate} emailTemplate - The email Data
   * @param {string} address The receivers email address
   * @return Promise
   * @version 1.0.0
   * @since 0.1.0 21.07.2021
   */
  send(emailTemplate: Template, address: string) {
    return new Promise((resolve, reject) => {
      this.createNodeMailerObj(emailTemplate.mail.smtpServerTags).then(
        (transporter) => {
          const mailOptions: Options = {
            from:
              emailTemplate.mail.from +
              ' ' +
              transporter.transporter.mailer?.options.from,
            to: address,
            subject: emailTemplate.mail.subject,
            text: emailTemplate.mail.text,
            html: emailTemplate.mail.html,
          };
          if (this.checkEmail(address)) {
            this.nodeMailerSend(mailOptions, transporter).then(resolve, reject);
          } else reject('Incorrect Email Address');
        }
      );
    });
  }

  /**
   * Small alias function for the email validation
   * @param {string} address the receivers email address
   * @return boolean - True if email is valid, false if not
   * @author Nico Wagner
   * @version 1.0.0
   * @since 0.1.0 21.07.2021
   */
  private checkEmail = (address: string) => emailvalidator.validate(address);

  /**
   * The function uses the given transporter and sends the email
   * @param {Options} mailOptions - the email object with the template data etc.
   * @param {Mail<SentMessageInfo>}transporter the nodemailer transporter which will be used to send the email
   * @private
   * @author Nico Wagner
   * @version 1.0.0
   * @since 0.1.0 21.07.2021
   */
  private nodeMailerSend(
    mailOptions: Options,
    transporter: Mail<SentMessageInfo>
  ) {
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error(`error: ${error}`);
          reject(error);
        }
        logger.debug(`Message Sent ${JSON.stringify(info)}`);
        resolve(info);
      });
    });
  }
}

export default Mailer;
