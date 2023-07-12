import { aulaDB } from "../config/database";

export default {

    /**
     * ? Retorna os conteúdos gratuitos disponíveis.
     * ---
     * @return {plans} (obj) Informações do plano.
     */
    async getFreeContents(req, res) {
        const { status } = req.query;

        try {
            //Verificação de parâmetro incorreto
            if(status){
                if (status !== 'active' && status !== 'inactive') {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro status com valor inválido. Tente active ou inactive'
                    })
                };
            };


            const freeContent = await aulaDB
                .from('free_content')
                .where((builder) => {

                    if (status) {
                        builder.where('free_content.status', status);
                    }
                });

            return res.status(200).send(freeContent);

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar os conteudos gratuitos",
                error,
            });
        }
    },
}