import * as nodemailer from 'nodemailer';
import * as emailvalidator from 'email-validator';
import * as Mail from 'nodemailer/lib/mailer';
import { Options } from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer';
import { ElementCache, ICache } from './ElementCache';
import { AxiosResponse } from 'axios';
import { EmailTemplate } from '../interfaces/IHTTPTemplate';

interface ISMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
}
export interface x extends ISMTPConfig, ICache {
  path: string;
}

class SMTPElementCache<T extends ICache> extends ElementCache<T> {
  public getElementFromDB<T>(
    _tags: string
  ): Promise<AxiosResponse<{ data: T }>> {
    return this.axios.get<{ data: T }>('/', {
      params: {
        tags: ['primary'],
      },
    });
  }

  public fetchServerByTags<T>(tags: string[]) {
    return this.axios.get<{ data: T }>('/', {
      params: {
        tags: ['primary', ...tags],
      },
    });
  }
}

/**
 * @author Nico Wagner
 * @version 1.0.0
 * @since 0.1.0 21.07.2021
 */
class Mailer {
  private smtpServerCache: SMTPElementCache<x>;

  constructor(jwt: string) {
    this.smtpServerCache = new SMTPElementCache({
      rootURLPath: '/smtpservers/',
      ttl: 0.2 * 60,
      jwt,
    });
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
      this.smtpServerCache
        .fetchServerByTags(smtpServerTags || [])
        .then((data) => {
          console.log(data.data);
        });

      this.smtpServerCache
        .getElement('00000000-0000-0000-0000-000000000000')
        .then((obj) => {
          console.log(
            new Date(),
            'Creating Node Mailer Transport with',
            obj.host,
            obj.username,
            obj.port
          );
          const transporter = nodemailer.createTransport({
            from: obj.username,
            host: obj.host,
            port: obj.port,
            secure: obj.secure,
            auth: {
              user: obj.username,
              pass: obj.password,
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
  send(emailTemplate: EmailTemplate, address: string) {
    return new Promise((resolve, reject) => {
      this.createNodeMailerObj(emailTemplate.tags).then((transporter) => {
        const mailOptions: Options = {
          from:
            emailTemplate.from +
            ' ' +
            transporter.transporter.mailer?.options.from,
          to: address,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        };
        if (this.checkEmail(address)) {
          this.nodeMailerSend(mailOptions, transporter).then(resolve, reject);
        } else reject('Incorrect Email Address');
      });
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
          console.log(new Date(), `error: ${error}`);
          reject(error);
        }
        console.log(new Date(), `Message Sent ${JSON.stringify(info)}`);
        resolve(info);
      });
    });
  }
}

export default Mailer;
