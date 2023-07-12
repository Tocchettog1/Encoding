import { aulaDB } from "../config/database";
import moment from "moment";

export default {
    async isValid(req, res) {
        const {code} = req.params;
        const currentDate = moment().format('YYYY-MM-DD');

        try {
            const response = await aulaDB('coupons')
            .first()
            .where({code});
            
            if(!response || response.status !== 'active' || moment(response.validity_start).format('YYYY-MM-DD') > currentDate || moment(response.validity_end).format('YYYY-MM-DD') < currentDate) {
                return res.status(400).json({
                    status: 'Inactive', 
                    message: 'O cupom informado não foi encontrado ou não está disponível para utilização.'
                });
            };

            return res.status(200).json({
                status: response.status,
                message: 'Cupom ativado! Agora é só finalizar sua compra.',
                discount: response.discount,
                discount_type: response.discount_type,
            });

        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar o cupom",
                error,
            });
        }
    },
}