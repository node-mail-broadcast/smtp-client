import { Template } from '@node-mail-broadcast/node-mailer-ts-api';

export type EmailTemplate = Pick<Template, 'mail'>;

export type EmailTemplateFields = Pick<
  EmailTemplate['mail'],
  'text' | 'html' | 'subject' | 'from'
>;
