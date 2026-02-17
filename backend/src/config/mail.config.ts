import * as nodemailer from 'nodemailer';
import { envConfigService } from './env-config.service';

const mailConfig = envConfigService.getMailConfig();

export const mailTransporter: nodemailer.Transporter =
    nodemailer.createTransport({
        host: mailConfig.MAIL_HOST,
        port: mailConfig.MAIL_PORT,
        secure: false,
        auth: {
            user: mailConfig.MAIL_USER,
            pass: mailConfig.MAIL_PASSWORD,
        },
        tls: { rejectUnauthorized: false },
    });

export const mailFrom = mailConfig.MAIL_FROM;
