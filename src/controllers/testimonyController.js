import { aulaDB } from "../config/database";

export default {
      /**
     * ? Retorna os depoimentos dos alunos.
     * ---
     * @return {testimonials} (arr) Depoimentos.
     */
    async getTestimonials(req, res) {
        try {
            const testimonials = await aulaDB
            .from('testimonials');
            
            res.status(200).send(testimonials);
            
        } catch (error) {
            return res.status(400).json({
                status: "Error",
                message: "Tivemos problemas ao buscar os depoimentos",
                error,
            });
        }
    },
}