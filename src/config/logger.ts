import pino from 'pino';
import { config } from './index';

export const logger = pino({
  level: config.log.level,
  ...(config.isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    },
  }),
  ...(config.isProd && {
    redact: {
      paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
      censor: '[REDACTED]',
    },
  }),
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});
