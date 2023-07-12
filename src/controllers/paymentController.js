import moment from "moment/moment";
import { Pagarme } from "../config/axios";
import { aulaDB } from "../config/database";
import * as yup from 'yup';

export default {
    /**
    * ? Assina um pagamento anual via cartão de crédito, boleto ou pix.
    * ---
    * @return {response} (obj) informações para uso do front e mensagem de sucesso
    */
    async uniquePayment(req, res) {
        const { customer, item, payment, method, link, billing } = req.body;
        let payments = [];
        let items = [];
        let response;

        try {
            if (billing !== 'year' && billing !== 'month') {
                throw new Error('Billing incorreto. Os valores aceitos são: "month" ou "year"')
            };

            //Validações de usuário
            const customerSchema = yup.object({
                name: yup.string().required(),
                email: yup.string().required()
                    .email('Insira um e-mail válido'),
                document: yup.string().required()
                    .matches(/^\d{11}$/, 'Digite um CPF válido (somente números).'),
                phone: yup.string()
                    .matches(/^\d{2}\9\d{4}\d{4}$/, 'Numero de telefone inválido, use somente números (incluso DDD).'),
                address: yup.object({
                    city: yup.string().required(),
                    state: yup.string().required().max(2, 'Estado inválido. Utilize a sigla UF.'),
                    country: yup.string().required().max(2, 'País inválido. Utilize a sigla UF.'),
                    zip_code: yup.string().required()
                        .matches(/^([0-9]){8}$/, 'Digite um CEP válido (somente números).'),
                    street: yup.string().required(),
                    number: yup.string(),
                    neighborhood: yup.string().required(),
                    complement: yup.string()
                })
            });

            customerSchema.validateSync(customer);

            //Validações de pagamento
            if (method === 'credit_card') {
                const paymentSchema = yup.object({
                    card_number: yup.string().required()
                        .matches(/^([0-9]){13,19}$/, 'Digite um número de cartão válido (somente números).'),
                    holder_name: yup.string().required(),
                    exp_month: yup.string().required()
                        .matches(/^([1-9]|0[1-9]|1[0,1,2])$/, 'Mês de validade incorreto. Use dígitos entre 1 e 12'),
                    exp_year: yup.string().required()
                        .matches(/^\d{2}(\d[0-9])?$/, 'Ano de validade incorreto. Use 2 ou 4 dígitos.'),
                    cvv: yup.string().required().min(3, 'CVV inválido.').max(4, 'CVV inválido.'),
                    installments: yup.number().integer(),
                    address: yup.object({
                        city: yup.string().required(),
                        state: yup.string().required().max(2, 'Estado inválido. Utilize a sigla UF.'),
                        country: yup.string().required().max(2, 'País inválido. Utilize a sigla UF.'),
                        zip_code: yup.string().required()
                            .matches(/^([0-9]){8}$/, 'Digite um CEP válido (somente números).'),
                        street: yup.string().required(),
                        number: yup.string(),
                        neighborhood: yup.string().required(),
                        complement: yup.string()
                    })
                });

                paymentSchema.validateSync(payment);
            };

            //adicionando os valores do parâmetro item no array de items
            items.push({
                amount: item.amount,
                description: item.description,
                quantity: 1,
                code: item.id
            });

            //Condicionais para os métodos de pagamento
            switch (method) {
                case 'pix':
                    payments.push({
                        Pix: {
                            expires_in: 3600,
                        },
                        amount: item.amount,
                        payment_method: "pix"
                    });
                    break;
                case 'boleto':
                    payments.push({
                        boleto: {
                            bank: '104',
                            due_at: moment().add(3, 'd').format("MM/DD/YYYY")
                        },
                        amount: item.amount,
                        payment_method: "boleto"
                    });
                    break;
                case 'credit_card':
                    payments.push({
                        credit_card: {
                            card: {
                                billing_address: {
                                    line_1: `${payment.address.number},${payment.address.street},${payment.address.neighborhood}`,
                                    line_2: payment.address.complement,
                                    zip_code: payment.address.zip_code,
                                    city: payment.address.city,
                                    state: payment.address.state.toUpperCase(),
                                    country: payment.address.country.toUpperCase()
                                },
                                number: payment.card_number,
                                holder_name: payment.holder_name,
                                exp_month: payment.exp_month,
                                exp_year: payment.exp_year,
                                cvv: payment.cvv
                            },
                            installments: payment.installments,
                            statement_descriptor: payment.statement_descriptor
                        },
                        payment_method: "credit_card",
                        amount: item.amount
                    })
                    break;
            };

            //formatação do body
            const ddd = customer.phone.slice(0, 2)
            const number = customer.phone.slice(2)
            const phones = {
                mobile_phone: {
                    country_code: '55',
                    area_code: ddd,
                    number: number
                }
            };

            const body = {
                customer: {
                    phones,
                    name: customer.name,
                    type: 'individual',
                    email: customer.email,
                    document: customer.document,
                    document_type: 'CPF'
                },
                items,
                payments,
                closed: true
            };

            //Envido do body padronizado para a API do Pagar.me
            const paymentData = await Pagarme.post('/orders', JSON.stringify(body))
                .catch(function (error) {
                    if (error.response.status = 422) {
                        return Promise.reject({
                                status: 'Invalid Card',
                                message: 'Dado(s) incorreto(s). Verifique os dados do cartão novamente.'
                            })
                    };
                });

            //Verificação de sucesso na Pagar.me
            if (paymentData.data.charges[0].last_transaction.success !== true) {
                console.log(paymentData.data.charges[0].last_transaction)
                return await Promise.reject({
                    status: paymentData.data.charges[0].last_transaction.acquirer_return_code,
                    message: paymentData.data.charges[0].last_transaction.acquirer_message
                })
            };

            //Condicionais para retornos de sucesso
            switch (method) {
                case 'boleto':
                    response = {
                        success: paymentData.data.charges[0].last_transaction.success,
                        id: paymentData.data.id,
                        transaction_type: paymentData.data.charges[0].last_transaction.transaction_type,
                        pdf: paymentData.data.charges[0].last_transaction.pdf,
                        digitable_line: paymentData.data.charges[0].last_transaction.line
                    }
                    break;
                case 'pix':
                    response = {
                        success: paymentData.data.charges[0].last_transaction.success,
                        id: paymentData.data.id,
                        transaction_type: paymentData.data.charges[0].last_transaction.transaction_type,
                        qr_code_img: paymentData.data.charges[0].last_transaction.qr_code_url,
                        copy_paste_code: paymentData.data.charges[0].last_transaction.qr_code
                    }
                    break;
                case 'credit_card':
                    response = {
                        success: paymentData.data.charges[0].last_transaction.success,
                        message: paymentData.data.charges[0].last_transaction.acquirer_message,
                        id: paymentData.data.id,
                        transaction_type: paymentData.data.charges[0].last_transaction.transaction_type,
                        installments: paymentData.data.charges[0].last_transaction.installments,
                        copy_paste_code: paymentData.data.charges[0].last_transaction.qr_code
                    }
                    break;
            };

            //Atualiza a tabela Students com o numero corrigido.
            const getPhone = await aulaDB('development.students')
                .select('phone_number')
                .first()
                .where('id', customer.id);

            if (customer.phone !== getPhone.phone_number) {
                await aulaDB('development.students')
                    .update({ phone_number: customer.phone })
                    .where('id', customer.id)
            };

            // insere o os dados do usuário na tabela student_purchase_interest
            const invoiceData = {
                student: customer.id,
                email: customer.email,
                name: customer.name,
                cpf: customer.document,
                phone: customer.phone,
                zipCode: customer.address.zip_code,
                address: customer.address.street,
                number: customer.address.number,
                complement: customer.address.complement,
                neighborhood: customer.address.neighborhood,
                city: customer.address.city,
                state: customer.address.state.toUpperCase(),
                link: link,
                method: method,
                billing: billing,
                transaction: response.id
            }

            await aulaDB('development.student_purchase_interest')
                .insert(invoiceData);

            return res.status(200).json(response);

        } catch (error) {
            console.log(error)
            if(error.status){
                return res.status(422).json(error)
            };
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao relizar o pagamento",
            });
        }
    },

    /**
     * ? Assina um pagamento mensal via cartão de crédito.
      * ---
     * @return {response} (obj) informações para uso do front e mensagem de sucesso
     */
    async recurrentPayment(req, res) {
        const { recurrent_id, customer, item, payment, method, link } = req.body;
        let response;
        let phones;

        try {
            //Validações de usuário
            const customerSchema = yup.object({
                name: yup.string().required(),
                email: yup.string().required()
                    .email('Insira um e-mail válido'),
                document: yup.string().required()
                    .matches(/^\d{11}$/, 'Digite um CPF válido. (Somente números)'),
                phone: yup.string()
                    .matches(/^\d{2}\9\d{4}\d{4}$/, 'Numero de telefone inválido, use somente números (incluso DDD).'),
                address: yup.object({
                    city: yup.string().required(),
                    state: yup.string().required().max(2, 'Estado inválido. Utilize a sigla UF.'),
                    country: yup.string().required().max(2, 'País inválido. Utilize a sigla UF.'),
                    zip_code: yup.string().required()
                        .matches(/^([0-9]){8}$/, 'Digite um CEP válido (somente números).'),
                    street: yup.string().required(),
                    number: yup.string(),
                    neighborhood: yup.string().required(),
                    complement: yup.string()
                })
            });

            customerSchema.validateSync(customer);

            //Validações de pagamento
            const paymentSchema = yup.object({
                card_number: yup.string().required()
                    .matches(/^([0-9]){13,19}$/, 'Digite um número de cartão válido (somente números).'),
                holder_name: yup.string().required(),
                exp_month: yup.string().required()
                    .matches(/^([1-9]|0[1-9]|1[0,1,2])$/, 'Mês de validade incorreto. Use dígitos entre 1 e 12'),
                exp_year: yup.string().required()
                    .matches(/^\d{2}(\d[0-9])?$/, 'Ano de validade incorreto. Use 2 ou 4 dígitos.'),
                cvv: yup.string().required().min(3, 'CVV inválido.').max(4, 'CVV inválido.'),
                address: yup.object({
                    city: yup.string().required(),
                    state: yup.string().required().max(2, 'Estado inválido. Utilize a sigla UF.'),
                    country: yup.string().required().max(2, 'País inválido. Utilize a sigla UF.'),
                    zip_code: yup.string().required()
                        .matches(/^([0-9]){8}$/, 'Digite um CEP válido (somente números).'),
                    street: yup.string().required(),
                    number: yup.string(),
                    neighborhood: yup.string().required(),
                    complement: yup.string()
                })
            });

            paymentSchema.validateSync(payment);

            //formatação do body
            const ddd = customer.phone.slice(0, 2)
            const number = customer.phone.slice(2)
            phones = {
                mobile_phone: {
                    country_code: '55',
                    area_code: ddd,
                    number: number
                }
            }
            const body = {
                customer: {
                    phones,
                    name: customer.name,
                    type: 'individual',
                    email: customer.email,
                    document: customer.document,
                    document_type: 'CPF'
                },
                card: {
                    billing_address: {
                        line_1: `${payment.address.number},${payment.address.street},${payment.address.neighborhood}`,
                        line_2: payment.address.complement,
                        zip_code: payment.address.zip_code,
                        city: payment.address.city,
                        state: payment.address.state.toUpperCase(),
                        country: payment.address.country.toUpperCase()
                    },
                    number: payment.card_number,
                    holder_name: payment.holder_name,
                    exp_month: payment.exp_month,
                    exp_year: payment.exp_year,
                    cvv: payment.cvv,
                    brand: payment.brand
                },
                code: item.id,
                plan_id: recurrent_id,
                payment_method: 'credit_card'
            };

            //Envido do body padronizado para a API do Pagar.me
            const paymentData = await Pagarme.post('/subscriptions', JSON.stringify(body))
            .catch(function (error) {
                if (error.response.status) {
                    return Promise.reject(error)
                };
            });

            //Verificação de sucesso na Pagar.me
            if (paymentData.data.status !== 'active') {
                return Promise.reject({
                    status: 'Error',
                    message: 'Falha no pagamento.'
                })
            };

            //retorno de sucesso
            response = {
                status: paymentData.data.plan.status,
                id: paymentData.data.id,
                plan: paymentData.data.plan.name,
                payment_method: paymentData.data.plan.payment_methods[0],
                billing_type: paymentData.data.plan.billing_type,
                interval: paymentData.data.plan.interval
            }

            //Atualiza a tabela Students com o numero corrigido.
            const getPhone = await aulaDB('development.students')
                .select('phone_number')
                .first()
                .where('id', customer.id);

            if (customer.phone !== getPhone.phone_number) {
                await aulaDB('development.students')
                    .update({ phone_number: customer.phone })
                    .where('id', customer.id)
            };

            //Dados para NF
            const invoiceData = {
                student: customer.id,
                email: customer.email,
                name: customer.name,
                cpf: customer.document,
                phone: customer.phone,
                zipCode: customer.address.zip_code,
                address: customer.address.street,
                number: customer.address.number,
                complement: customer.address.complement,
                neighborhood: customer.address.neighborhood,
                city: customer.address.city,
                state: customer.address.state.toUpperCase(),
                link: link,
                method: method,
                transaction: paymentData.data.id
            }

            //insere o os dados do usuário na tabela student_purchase_interest
            await aulaDB('development.student_purchase_interest')
                .insert(invoiceData);

            return res.status(200).json(response);

        } catch (error) {
            console.log(error)
            if(error.status){
                return res.status(422).json(error)
            };
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao relizar o pagamento",
            });
        }
    },

    /**
     * ? Recebe um webHook com dados para inserção na tabela student_courses.
      * ---
     * @return {message} (obj) status e mensagem de sucesso.
     */
    async webhooks(req, res) {
        const { type, data } = req.body;
        let validate;
        let access;

        try {
            const getId = await aulaDB('development.students')
                .select('id')
                .first()
                .where('email', data.customer.email);

            //Formato para compra única / anual
            if (type === 'order.paid') {
                const getTransaction = await aulaDB('development.student_purchase_interest')
                    .select('billing')
                    .first()
                    .where('transaction', data.id);

                switch (getTransaction.billing) {
                    case 'year':
                        validate = moment().add(1, 'year').format('YYYY-MM-DD hh:mm:ss')
                        break;
                    case 'month':
                        validate = moment().add(1, 'month').format('YYYY-MM-DD hh:mm:ss')
                        break;
                }

                access = {
                    student: getId.id,
                    course: data.items[0].code,
                    payment_method: data.charges[0].payment_method,
                    validate
                }
            };

            //Formato para compra recorrente
            if (type === 'invoice.paid') {
                const getTransaction = await aulaDB('development.student_purchase_interest')
                    .select('method')
                    .first()
                    .where('transaction', data.subscription.id);

                validate = moment().add(1, 'month').format('YYYY-MM-DD hh:mm:ss');

                access = {
                    student: getId.id,
                    course: data.subscription.code,
                    payment_method: getTransaction.method,
                    validate
                }
            };

            //Retorna dados no terminal e insere no banco
            await aulaDB('development.student_courses')
                .insert(access);

            return res.status(200).json({
                status: 'Success',
                message: 'Acesso liberado.'
            });

        } catch (error) {
            console.log(error);
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao validar o pagamento",
                error: {
                    status: error.name,
                    message: error.message
                },
            });
        }
    },
}