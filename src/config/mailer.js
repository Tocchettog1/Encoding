import nodemailer from 'nodemailer';

const mailerConfig =  {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
}

export const transporter =  nodemailer.createTransport(mailerConfig);