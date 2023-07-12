import { aulaDB } from "../config/database"


export default {

    /**
     * ? Lista os cursos de um estudante.
     * ---
     * @return {courses} (obj) Histórico de cursos do estudante.
     */
    async get(req, res) {
        const { studentId } = req.params
        try {
            const courses = await aulaDB('development.student_courses')
                .join('plans', 'plans.course_id', 'student_courses.course')
                .select(
                    'title',
                    'register',
                    'validate',
                    'student_courses.status'
                )
                .where('student', studentId)
                .orderBy('register');

                return res.status(200).json(courses);

        } catch (error) {
            return res.status(400).json({
                status: 'Error',
                message: 'Erro ao fazer login.',
                error,
            })
        }
    },
}