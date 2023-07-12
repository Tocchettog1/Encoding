import { format } from "path";
import { aulaDB } from "../config/database";
import { transporter } from "../config/mailer";
import getPaginationResponse from "../utils/getPaginationResponse";
import exportData from "../utils/exportData";



export default {

    /**
     * ? Retorna todas as FAQs.
     * ---
     * @return {faqs} (arr) lista de FAQs
     */
    async getFaqs(req, res) {
        const { title, external, status, category, pagination, limit, page, exportation } = req.query;

        try {

            //Verificações de parâmetros incorretos
            if (external) {
                if (parseInt(external) !== 1 && parseInt(external) !== 0) {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro external com valor inválido. Tente 1 ou 0'
                    })
                };
            };

            if (category) {
                if (isNaN(category) === true) {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro category com valor inválido. Tente passar um Number'
                    })
                };
            };

            if (status) {
                if (status !== 'active' && status !== 'inactive') {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro status com valor inválido. Tente active ou inactive'
                    });
                };
            };

            const faqs = aulaDB('faq')
                .join('faq_category as fa', 'faq.category', 'fa.id')
                .select('faq.id',
                    'faq.title',
                    'faq.slug',
                    'faq.content',
                    'faq.status',
                    'faq.position',
                    'faq.category',
                    'fa.title as category_name',
                    'faq.external')
                    // .limit(1)
                .orderBy('position')
                .where((builder) => {

                    if (title)
                        builder.where('faq.title', 'like', `%${title}%`)

                    if (external)
                        builder.where('faq.external', external);

                    if (category)
                        builder.where('faq.category', category);

                    if (status)
                        builder.where('faq.status', status);

                })

            const response = await getPaginationResponse(faqs, pagination, page, limit);

            //Exportação de dados
            if(exportation) {
                let result = [];
                let title = 'FAQs';

                pagination == 'false' ? result = exportData(response, title) : result = exportData(response.data, title);

                return res.status(200).json(result)
            };

            return res.status(200).json(response);

        } catch (error) {
            console.log(error)
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar as FAQs",
                error,
            });
        }
    },

    /**
     * ? Retorna uma FAQ a partir de um ID.
     * ---
     * @return {faq} (obj) dados da FAQ
     */
    async getFaqById(req, res) {
        const { id } = req.params;

        try {
            const faq = await aulaDB('faq')
                .join('faq_category as fa', 'faq.category', 'fa.id')
                .select('faq.id',
                    'faq.title',
                    'faq.slug',
                    'faq.content',
                    'faq.status',
                    'faq.position',
                    'faq.category',
                    'fa.title as category_name',
                    'faq.external')
                .first()
                .where({ 'faq.id': id });

            if(!faq)
                return res.status(404).json({
                    status: 'Not Found',
                    message: 'FAQ não encontrada.'
                });

            return res.status(200).json(faq);

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar a FAQ",
                error,
            });
        }
    },

    /**
    * ? Cria uma nova FAQ.
    * ---
    * @return {message} (string) mensagem de sucesso.
    */
    async postFaq(req, res) {
        const { title, content, status, category, external } = req.body;
        let position;

        try {
            if (!title || !content || !category) {
                return res.status(400).json({
                    status: 'Missing Params',
                    message: 'Algum parâmetro esta inválido ou ausente.'
                })
            };

            //Modificando o título para slug.
            const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "").split(' ').join('-');

            //Somando + 1 à ultima posição
            const lastPosition = await aulaDB('faq_category')
                .max('position', {as: 'value'})

            position = lastPosition[0].value +1

            await aulaDB('faq')
                .insert({
                    title,
                    slug,
                    content,
                    status,
                    position,
                    category,
                    external
                });

            return res.status(201).json({
                status: 'Success',
                message: 'FAQ registrada com sucesso!'
            });

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao cadastrar a FAQ",
                error,
            });
        }
    },

     /**
     * ? Edita um ou mais dados de uma FAQ.
     * ---
     * @return {message} (string) mensagem de sucesso.
     */
    async updateFaq(req, res) {
        const{ id } = req.params;
        const { title, content, status, position, category, external } = req.body;
        let slug;

        try {
            //Modificando o título para slug.
            if(title){
                slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "").split(' ').join('-');
            }

            await aulaDB('faq')
            .update({
                title,
                slug,
                content,
                status,
                position,
                category,
                external
            })
            .where({'faq.id': id});

            return res.status(200).json({
                status: 'Success',
                message: 'FAQ atualizada!'
            });

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao atualizar a FAQ",
                error,
            });
        }
    },

    /**
     * ? Deleta uma FAQ a partir de um ID.
     * ---
     * @return {message} (string) mensagem de sucesso.
     */
    async deleteFaq(req, res) {
        const { id } = req.params;

        try {

            await aulaDB('faq')
                .delete()
                .where({ 'faq.id': id });

            return res.status(200).json({
                status: 'Success',
                message: 'FAQ deletada como sucesso!'
            });

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao deletar a FAQ",
                error,
            });
        }
    },

    /**
     * ? Envia formulário de dúvidas via email .
     * ---
     * @return {message} (string) mensagem de sucesso.
     */
    async contactUs(req, res) {
        const { name, email, message } = req.body;

        try {

            if (!name || !email || !message) {
                return res.status(400).json({
                    status: 'Bad Request',
                    message: 'Ops! Parece que está faltando alguma informação.'
                })
            };

            const mailOptions = {
                from: process.env.MAIL_USER,
                to: process.env.MAIL_USER,
                subject: `Contato via site -  ${name}`,
                html: ` <h3>Foi enviada uma nova mensagem via site</h3>
                    <br/>
                    <p>
                    <strong> • Nome: </strong> ${name}
                    <br/>
                    <strong> • Email: </strong> ${email}
                    <br/>
                    <strong> • Mensagem: </strong> ${message}
                    <br/>
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
                        message: 'Recebemos sua mensagem, em breve entraremos em contato no seu email.'
                    })
                };
            })

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao enviar a mensagem",
                error,
            });
        }
    },
}