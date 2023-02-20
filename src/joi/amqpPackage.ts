import * as Joi from 'joi';
import { IJson } from '../interfaces/IJson';

export const amqpPackageSchema = Joi.object<IJson>({
  address: Joi.object().alter({
    create: (schema) => schema.required(),
  }),
  template: Joi.string().alter({
    create: (schema) => schema.required(),
  }),
  // mail: {
  //   variables: Joi.array()
  //     .default([])
  //     .alter({
  //       create: (schema) => schema.optional(),
  //     }),
  data: Joi.object()
    .default({})
    .alter({
      create: (schema) => schema.optional(),
    }),
});
