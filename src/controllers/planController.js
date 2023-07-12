import { aulaDB } from "../config/database";

export default {

    /**
     * ? Retorna os planos disponíveis e seus atributos.
     * ---
     * @return {plans} (arr) Planos e Informações.
     */
    async getPlans(req, res) {
        let attributes = [];
        let plans = [];
        const { status } = req.query;

        try {
            //Verificação de parâmetro incorreto
            if (status) {
                if (status !== 'active' && status !== 'inactive') {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro incorreto. Tente usar active ou inactive.'
                    })
                };
            };

            const response = await aulaDB
                .from('plans')
                .where((builder) => {

                    if (status) {
                        builder.where('plans.status', status);
                    };
                });

            for (let plan of response) {
                attributes = await aulaDB('plan_attributes as pa')
                    .orderBy('pa.order')
                    .where('pa.plan_id', plan.id)

                plans.push({
                    id: plan.course_id,
                    recurrent_id: plan.recurrent_id,
                    title: plan.title,
                    status: plan.status,
                    description: plan.description,
                    price: plan.price,
                    price_monthly: plan.price_monthly,
                    price_yearly: plan.price_yearly,
                    img: plan.img,
                    highlight: plan.highlight,
                    order: plan.order,
                    slug: plan.slug,
                    attributes: attributes
                })
            };

            return res.status(200).send(plans);

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar os planos",
                error,
            });
        }
    },

    /**
     * ? Retorna o plano disponíveis e seus atributos a partir de um id.
     * ---
     * @return {plan} (obj) Informações do plano.
     */
    async getPlanById(req, res) {
        let plan = [];
        const {id} = req.params;

        try {

            const response = await aulaDB
            .from('plans')
            .where('course_id',id);

            if(response.length < 1){
                return res.status(404).json({
                    Status: "Not Found",
                    message: "Nenhum usuário encontrado."
                })
            };

            const attributes = await aulaDB('plan_attributes as pa')
                    .select('description')
                    .orderBy('pa.order')
                    .where('pa.plan_id', id);

            for (let item of response) {
                plan.push({
                    id: item.course_id,
                    recurrent_id: item.recurrent_id,
                    title: item.title,
                    status: item.status,
                    price: item.price,
                    price_monthly: item.price_monthly,
                    price_yearly: item.price_yearly,
                    attributes: attributes
            })
            };

            return res.status(200).send(plan[0]);

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar o plano",
                error,
            });
        }
    },
}