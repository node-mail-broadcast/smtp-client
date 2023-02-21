import * as Joi from 'joi';
import { SendEmailByTemplatesIdRequest } from '@node-mail-broadcast/node-mailer-ts-api';

export const amqpPackageSchema = Joi.object<SendEmailByTemplatesIdRequest>({
  sendTo: Joi.object().alter({
    create: (schema) => schema.required(),
  }),
  templateUUID: Joi.string().alter({
    create: (schema) => schema.required(),
  }),
  data: Joi.object()
    .default({})
    .alter({
      create: (schema) => schema.optional(),
    }),
});
