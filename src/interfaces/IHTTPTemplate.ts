export interface IHTTPTemplate {
  name: string;
  enabled: boolean;
  lastEdited: number;
  variables: string[];
  html: string;
  text: string;
  from: string;
  subject: string;
  language: string;
  uuid: string;
  __v: number;
}

export type EmailTemplate = Pick<
  IHTTPTemplate,
  'html' | 'text' | 'subject' | 'from'
>;
