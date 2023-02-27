import nodemailer from 'nodemailer';
import mailConfig from '../config/mailer';

export default nodemailer.createTransport(mailConfig);