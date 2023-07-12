import { aulaDB } from "../config/database";
import * as yup from 'yup';
import md5 from "md5";
import exportData from "../utils/exportData";
import { transporter } from "../config/mailer";
const generatePass = require('generate-password')

export default {

    /**
     * ? Busca de Estudantes.
     * ---
     * @return {response} (obj) Infos de paginação e dados do(s) Estudante(s).
     */
    async get(req, res) {
        const { name, email, city, state, status, pagination, page, limit, exportation } = req.query;
        let title = 'Students';

        //Criando paginação
        let size = parseInt(limit)
        size ? size : size = 10

        let current = parseInt(page)
        current? current : current = 1

        let offset = size*(current-1);

        try {
            const students = aulaDB('development.students')
                .leftJoin('development.student_address', 'students.id', 'student_address.student')
                .leftJoin('development.pre_registration_codes', 'students.id', 'pre_registration_codes.student')
                .select(
                'students.id', 
                'name', 
                'email', 
                'birthday', 
                aulaDB.raw(`CONCAT(student_address.city, ' / ', student_address.state) as local`),
                'googleplus_id',
                'facebook_id',
                'code',
                'students.status'
                )
                .where((builder) => {
                    if (name) {
                        builder.where('name', 'like', `%${name}%`)
                    };
                    if (email) {
                        builder.where('email', 'like', `%${email}%`)
                    };
                    if (city) {
                        builder.where('city', 'like', `%${city}%`)
                    };
                    if(state) {
                        builder.where('state', state)
                    };
                    if (status) {
                        builder.where({ status })
                    };
                })
                .orderBy('students.id')

                //Se 'pagination' = 'false' retorna sem paginação
                if(pagination === 'false'){
                    const data = await students;

                    //Exportação de dados s/paginação
                    if(exportation) {

                        const result = exportData(data, title)

                        return res.status(200).json(result)
                    };

                    return res.status(200).json(data)
                }

                const data = await students
                    .limit(size)
                    .offset(offset);

                //Exportação de dados c/paginação
                if(exportation) {

                    const result = exportData(data, title)

                    return res.status(200).json(result)
                };

                //Pagina anterior e próxima página
                let prevPage = current === 1 ? null : current - 1 
                let nextPage = data.length < size ? null : current + 1

                return res.status(200).json({
                    pagination:{
                        currentPage: current,
                        from: offset+1,
                        to: offset+data.length,
                        perPage: data.length,
                        prevPage,
                        nextPage
                    },
                    data
                })

        } catch (error) {
            console.log(error)
            if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao cadastrar novo administrador'
            });
        }
    },

    async getById(req, res) {
        const { id } = req.params;

        try {
            const student = await aulaDB('development.students')
                .leftJoin('development.student_address', 'student_address.student', 'students.id')
                .select(
                    'students.id',
                    'name', 
                    'email',
                    'phone_number AS phone',
                    'gender',
                    'birthday',
                    'zipCode',
                    'address',
                    'number',
                    'complement',
                    'neighborhood',
                    'city',
                    'state',
                    'status',
                    'register_date',
                    )
                .first()
                .where('students.id',id)

            return res.status(200).send(student);

        } catch (error) {
            if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao cadastrar novo administrador'
            });
        }
    },

    /**
     * ? Registra um Estudante no BD.
     * ---
     * @return {message} (str) Mensagem de sucesso.
     */
    async registerStudent(req, res) {
        const {name, email, phone} = req.body;

        try {
             //Validações de cadastro
             const schema = yup.object({
                name: yup.string().required('Preencha o campo nome corretamente.'),
                email: yup.string().required()
                    .matches(/^\S+@\S+\.\S+$/, 'Digite um email válido.'),
                phone: yup.string().required()
                    .matches(/^\d{2}\9\d{4}\d{4}$/, 'Celular incorreto. Use somente dígitos (incluso DDD).')
            });

            schema.validateSync({ name, email, phone });

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

            const newPass = generatePass.generate({
                length: 8,
                numbers: true
            });

            await aulaDB('development.students')
                .insert({
                    name,
                    email,
                    password: md5(newPass),
                    phone_number: phone 
                });

            //Envio da senha por email
            const mailOptions = {
                from: `Juju - Aulalivre.net <${process.env.MAIL_USER}>`,
                to: email,
                subject: `Aulalivre.net | Minha senha`,
                html: ` <h3><strong> Olá, ${name}! </strong></h3>
                <p>
                Aqui está sua senha! 😎
                <br/>
                </p>
                <p>
                Para você acessar todos os nossos conteúdos é só utilizar a sua senha abaixo.
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
                    error: {
                        status: error.name,
                        message: error.message
                    },
                });

                else {
                    return res.status(200).json({
                        status: 'Success',
                        message: 'A senha foi enviada para o E-mail.'
                    })
                };
            })
        } catch (error) {
            if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao cadastrar novo administrador'
            });
        }
    },

    // /**
    //  * ? Edita os dados de um Estudande.
    //  * ---
    //  * @return {message} (str) Mensagem de sucesso.
    //  */
    async editStudent(req, res) {
        const { id } = req.params;
        const { name, phone, birthday, status } = req.body;
        try {
            if (status) {
                if (status !== 'active' && status !== 'inactive') {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro status com valor inválido. Tente active ou inactive'
                    });
                };
            };

            const body = {
                name,
                phone_number: phone,
                birthday,
                status
            }

            await aulaDB('development.students')
            .update(body)
            .where({id});

            return res.status(200).json({
                status: 'Success',
                message: 'Informações alteradas com sucesso!'
            });

        } catch (error) {
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao editar este aluno.',
                error,
            })
        }
    },
}