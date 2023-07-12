import { aulaDB } from "../config/database"
import getPaginationResponse from "../utils/getPaginationResponse";
import exportData from "../utils/exportData";

export default {
    /**
     * ? Retorna todas as categorias de FAQs.
     * ---
     * @return {categorys} (arr) lista de categorias.
     */
    async get(req, res) {
        const { title, status, pagination, limit, page, exportation } = req.query;

        try {
            //Verificações de parâmetros incorretos  
            if (status) {
                if (status !== 'active' && status !== 'inactive') {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro status com valor inválido. Tente active ou inactive'
                    });
                };
            };

            const categorys = aulaDB('faq_category')
                .select('faq_category.id',
                    'faq_category.title',
                    'faq_category.slug',
                    'faq_category.status',
                    'faq_category.position')
                .orderBy('position')
                .where((builder) => {

                    if (title)
                        builder.where('faq_category.title', 'like', `%${title}%`);

                    if (status)
                        builder.where('faq_category.status', status);

                })
            const response = await getPaginationResponse(categorys, pagination, page, limit);

            //Exportação de dados
            if(exportation == 'true') {
                let result = [];
                let title = 'Categorys';

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
     * ? Retorna uma Categoria a partir de um ID.
     * ---
     * @return {category} (obj) dados da FAQ
     */
    async getById(req, res) {
        const { id } = req.params;

        try {
            const category = await aulaDB('faq_category')
                .select()
                .first()
                .where({ id });

            if(!category)
                return res.status(404).json({
                    status: 'Not Found',
                    message: 'Categoria não encontrada.'
                });

            return res.status(200).json(category);

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar a Categoria",
                error,
            });
        }
    },

    /**
     * ? Cria uma nova Categoria.
     * ---
     * @return {message} (string) mensagem de sucesso.
     */
    async post(req, res) {
        const { title, status } = req.body;
        let position;

        try {
            if (!title) {
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

            position = lastPosition[0].value +1;

            await aulaDB('faq_category')
                .insert({
                    title,
                    slug,
                    status,
                    position
                });

            return res.status(201).json({
                status: 'Success',
                message: 'Categoria registrada com sucesso!'
            });

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao registrar a Categoria",
                error,
            });
        }
    },

    /**
     * ? Edita uma Categoria.
     * ---
     * @return {message} (string) mensagem de sucesso.
     */
    async update(req, res) {
        const { id } = req.params;
        const { title, status, position } = req.body;
        let slug;

        try {
            //Modificando o título para slug.
            if(title){
            slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "").split(' ').join('-')
            };

            await aulaDB('faq_category')
            .update({
                title,
                slug,
                status,
                position
            })
            .where({id});

            return res.status(200).json({
                status: 'Success',
                message: 'Categoria atualizada com sucesso!'
            })
            
        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao atualizar a Categoria",
                error,
            });
        }
    },

    /**
     * ? Deleta uma Categoria.
     * ---
     * @return {message} (string) mensagem de sucesso.
     */
    async delete(req, res) {
        const { id } = req.params;

        try {
            await aulaDB('faq_category')
            .delete()
            .where({id});

            return res.status(200).json({
                status: 'Success',
                message: 'Categoria deletada com sucesso!'
            });
            
        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao deletar a Categoria",
                error,
            });
        }
    }
}