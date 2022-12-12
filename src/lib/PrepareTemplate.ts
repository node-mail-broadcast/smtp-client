import { ElementCache } from './ElementCache';
import { EmailTemplate, IHTTPTemplate } from '../interfaces/IHTTPTemplate';
import { IJson } from '../interfaces/IJson';
import { logger } from '../utils/logger';

export interface ITemplate extends IHTTPTemplate {
  ttl: number;
}

/**
 * @author Nico Wagner
 * @version 1.0.0
 * @since 0.0.2 04.07.2021
 */
export class PrepareTemplate {
  private elementCache: ElementCache<ITemplate>;

  constructor() {
    this.elementCache = new ElementCache({
      rootURLPath: '/templates/',
      ttl: 0.2 * 60,
    });
  }

  /**
   * This function iterates over the variables array and replaces this keys with the values provided in the data json
   * @private
   * @author Nico Wagner
   * @version 1.0.0
   * @since 0.0.2 04.07.2021
   */
  private replaceEmailFields(
    { text, html, subject, from }: EmailTemplate,
    variables: string[],
    data: IJson
  ): EmailTemplate {
    //console.log(text, html, subject);
    variables.forEach((key) => {
      // eslint-disable-next-line no-prototype-builtins
      if (data.data.hasOwnProperty(key) && typeof data.data[key] === 'string') {
        const re = new RegExp(`%${key}%`, 'gim');
        logger.debug('REPLACE ' + re + ' with ' + data.data[key]);
        text = text.replace(re, data.data[key]);
        html = html.replace(re, data.data[key]);
      } else logger.warn('for json key ' + key + ' no data is given');
    });
    return { text, html, subject, from };
  }

  /**
   * Fetches the current template and replaces the placeholder, returning the template ready for sending
   * @param {EmailDataset} data - The Data
   * @return EmailTemplate - Promise
   * @author Nico Wagner
   * @version 1.0.0
   * @since 0.0.2 04.07.2021
   */
  public getTemplateForSending(data: IJson): Promise<EmailTemplate> {
    return new Promise((resolve, reject) => {
      this.elementCache
        .getElement(data.template)
        .then((template) => {
          const finishedEmailTemplate = this.replaceEmailFields(
            {
              text: template.text,
              html: template.html,
              subject: template.subject,
              from: template.from,
            },
            template.variables,
            data
          );
          resolve(finishedEmailTemplate);
        })
        .catch((err) => {
          //console.log(err);
          //if template ID does not exist
          reject(err);
        });
    });
  }
}
