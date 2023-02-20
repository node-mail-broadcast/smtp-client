import { EmailAddressesSend } from '@node-mail-broadcast/node-mailer-ts-api/api';

export interface IJson {
  address: EmailAddressesSend;
  template: string;
  data: Record<string, string>;
}
