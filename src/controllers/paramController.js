import { aulaDB } from "../config/database";

export default {
    /**
     * ? Busca todos os parâmetros.
     * ---
     * @return {params} (arr) Parâmetros diversos.
     */
    async getParams(req, res){
        try {
            
            const params = await aulaDB
            .from('parameters');

            return res.status(200).send(params);

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar os parâmetros.",
                error,
            });
        }
    },

    /**
     * ? Busca um parâmetro a partir de uma key.
     * ---
     * @return {param} (obj) Parâmetro.
     */
    async getParamByKey(req, res){
        const {key} = req.params;
        try {
            
            const verifyParam = await aulaDB
            .select('key')
            .from('parameters')
            .where({key})
            .first();
            
            if(!verifyParam){
                return res.status(404).json({
                    status: 'Not Found',
                    message: 'Parâmetro não encontrado.'
                })
            };

            const param = await aulaDB
            .from('parameters')
            .where({key});

            return res.status(200).send(param);

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar o parâmetro.",
                error,
            });
        }
    },

     /**
     * ? Altera um parâmetro.
     * ---
     * @return {string} Mensagem de sucesso.
     */
    async putParam(req, res){
        const id = Number(req.params.id);
        const {key, value, description} = req.body;

        if(isNaN(value)){
            return res.status(400).json({
                status: 'Bad Request',
                message: 'O parametro value deve ser um Number'
            })
        };

        
        try {
            
            const verifyParam = await aulaDB
            .select('id')
            .from('parameters')
            .where({id})
            .first();
            
            if(!verifyParam){
                return res.status(404).json({
                    status: 'Not Found',
                    message: 'Parâmetro não encontrado, não foi possível atualizar.'
                })
            };

            const body = {
                key: key,
                value: value,
                description: description
            };

            //Atualiza o BD
            await aulaDB('parameters')
            .update(body)
            .where({id});

            return res.status(200).send('Parâmetro alterado.');

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao atualizar o parâmetro.",
                error,
            });
        }
    },
}