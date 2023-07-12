import axios from "axios";
import config from './general'

//Configuração Pagar.me
export const Pagarme = axios.create({
    baseURL: process.env.PAGARME_BASE_URL,
    timeout: config.timeout,
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: 'Basic ' + Buffer.from(`${process.env.PAGARME_SECRET_KEY}:`).toString('base64')
    }
})