import { aulaDB } from "../config/database"
import { transporter } from "../config/mailer";
const generatePass = require('generate-password')
const md5 = require('md5');
import * as yup from 'yup';
import jwt from "jsonwebtoken";
import config from '../config/general';
import moment from "moment/moment";

export default {

    async signup(req, res) {
        const { name, email, password, phone } = req.body

        try {
            //Validações de cadastro
            const schema = yup.object({
                name: yup.string().required('Preencha o campo nome corretamente.'),
                email: yup.string().required()
                    .matches(/^\S+@\S+\.\S+$/, 'Digite um email válido.'),
                password: yup.string().required('Preencha o campo senha corretamente.'),
                phone: yup.string().required()
                    .matches(/^\d{2}\9\d{4}\d{4}$/, 'Celular incorreto. Use somente dígitos (incluso DDD).')
            });

            schema.validateSync({ name, email, password, phone });

            //Verifica se o email já está registrado
            const verifyEmail = await aulaDB('development.students')
                .select('email')
                .first()
                .where({ email });

            if (verifyEmail) {
                return res.status(422).json({
                    status: 422,
                    message: 'Email já cadastrado.'
                })
            };

            const user = {
                name,
                email,
                password: md5(password),
                phone_number: phone
            }

            // Cadastra os dados de acesso do aluno e busca o id
            const student = await aulaDB('development.students')
                .insert(user)
                .select(aulaDB.raw('LAST_INSERT_ID()'));

            const response = {
                id: student[0],
                name,
                email,
                phone
            }

            return res.status(201).json(response);
        } catch (error) {
            console.log(error)
            return res.status(400).json({
                status: "Error",
                message: "Erro ao fazer o cadastro.",
                error: {
                    status: error.name,
                    message: error.message
                },
            });
        }
    },

    async login(req, res) {
        const { email, password } = req.body;
        const pass = md5(password)

        try {
            // Busca infos do usuário pelo email
            const user = await aulaDB('development.students')
                .select('id', 'name', 'email', 'password', 'status', 'phone_number')
                .first()
                .where({ email });

            // Condicionais de validação
            if (!email || !user || pass !== user.password) {
                return res.status(400).json({
                    status: 400,
                    message: 'Email ou senha incorretos.'
                })
            };

            if (user.status !== 'active') {
                return res.status(401).json({
                    status: 401,
                    message: 'Acesso negado. Conta desativada'
                })
            };

            const response = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone_number
            }

            res.status(200).json(response)

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Erro ao fazer login.",
                error,
            });
        }
    },

    async loginAdmin(req, res) {
        const { email, password } = req.body;
        const pass = md5(password)
        const validity = 1296000; //15 dias //TODO: Alterar para valor menor após implementado o refresh.
        const expiration = moment().add(validity, 'seconds').format('yyyy-MM-DD HH:mm:ss');
        let permissions = [];

        try {
            // Busca infos do usuário pelo email
            const user = await aulaDB('team')
                .select()
                .first()
                .where({ email });

            // Condicionais de validação
            if (!email || !user || pass !== user.password) {
                return res.status(400).json({
                    status: 400,
                    message: 'Email ou senha incorretos.'
                })
            };

            if (user.status !== 'active') {
                return res.status(403).json({
                    status: 'Access denied',
                    message: 'Esta conta está desativada.'
                })
            };

            //Busca as permissões do administrador e insere em permissions
            const userPermissions = await aulaDB('user_permissions')
                .select('user', 'permission')
                .where('user', user.id);
         
                for (const p of userPermissions)
                    permissions.push(p.permission);                

            //Gera o token de acesso     
            const token = jwt.sign({ id: user.id }, config.authSecret, {
                expiresIn: validity,
            });

            //Montando a resposta conforme o tipo
            let response = {
                type: user.type,
                token,
                expiresIn: expiration
            }

            if(user.type === 'admin'){
                response = {
                    ...response, permissions
                }
            }

            return res.status(200).json(response)

        } catch (error) {
            return res.status(400).json({
                status: 'Error',
                message: 'Erro ao fazer login.',
                error,
            })
        }
    },
    
    async recoverPassword(req, res) {
        const { email } = req.body;

        try {
            const verifyEmail = await aulaDB('development.students')
                .select('email', 'name')
                .first()
                .where({ email });

            if (!verifyEmail) {
                return res.status(404).json({
                    status: 'Not Found',
                    message: 'Este e-mail não está cadastrado.'
                })
            };

            const newPass = generatePass.generate({
                length: 8,
                numbers: true
            });

            await aulaDB('development.students')
                .update({ password: md5(newPass) })
                .where({ email })

            //Envio da nova senha por email
            const mailOptions = {
                from: `Juju - Aulalivre.net <${process.env.MAIL_USER}>`,
                to: email,
                subject: `Aulalivre.net | Esqueci minha senha`,
                html: ` <h3><strong> Olá, ${verifyEmail.name}! </strong></h3>
                <p>
                Esqueceu a senha, né? Acontece! 😝
                <br/>
                </p>
                <p>
                Para você continuar acessando todos os nossos conteúdos é só utilizar a nova senha abaixo.
                E, se preferir alterá-la, é só clicar <a href='https://aulalivre.net/alterar-senha'>aqui</a>, ok?
                </p>
                <p>
                Sua nova senha agora é:
                </p>
                <p>
                <strong>${newPass}</strong>
                </p>
                <p>
                Atenciosamente,<br/>
                Equipe Aulalivre.
                </p>`
            }

            transporter.sendMail(mailOptions, function (error) {
                if (error) return res.status(400).json({
                    error: true,
                    message: "Email NÃO enviado!!",
                    error
                });

                else {
                    return res.status(200).json({
                        status: 'Success',
                        message: 'A nova senha está no seu E-mail.'
                    })
                };
            })

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Erro ao solcitar nova senha.",
                error,
            });
        }
    },

    // async changePassword(req, res) {
    //     const { id } = req.params;
    //     const { password, newPassword } = req.body;

    //     try {
    //         const verifyPass = await aulaDB('development.students')
    //         .select('password')
    //         .first()
    //         .where({id})

    //         if(md5(password) !== verifyPass.password){
    //             return res.status(404).json({
    //                 status: 'Not Found',
    //                 message: 'A senha atual está incorreta. Verifique e tente novamente.'
    //             })
    //         };

    //         console.log(verifyPass.password)
    //         await aulaDB('development.students')
    //         .update('password',md5(newPassword))
    //         .where({id});
            
    //         return res.status(200).send('ok')
    //     } catch (error) {
    //         return res.status(400).json({
    //             status: "Error",
    //             message:"Erro ao mudar senha.",
    //             error,
    //         });
    //     }
    // },
}