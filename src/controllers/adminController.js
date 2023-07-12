import { aulaDB } from "../config/database";
import md5 from "md5";
import * as yup from 'yup';
import getPaginationResponse from "../utils/getPaginationResponse";
import exportData from "../utils/exportData";

export default {
    /**
     * ? Retorna os Admins ou um Admin a partir de um filtro.
     * ---
     * @return {admins} (arr) Administradores.
     */
    async get(req, res) {
        const { email, status, pagination, page, limit, exportation } = req.query;

        try {
            if (status) {
                if (status !== 'active' && status !== 'inactive') {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro status com valor inválido. Tente active ou inactive'
                    });
                };
            };

            const admins = aulaDB('team')
                .select('id','email','status','type')
                .where((builder) => {
                    if(email){
                        builder.where('email','like',`%${email}%`)
                    };
                    if(status){
                        builder.where({ status })
                    };
                })
                .orderBy('email')

                const response = await getPaginationResponse(admins, pagination, page, limit);

                //Exportação de dados
                if(exportation == 'true') {
                    let result = [];
                    let title = 'Admins';

                    pagination == 'false' ? result = exportData(response, title) : result = exportData(response.data, title);

                    return res.status(200).json(result)
                };

                return res.status(200).json(response);

        } catch (error) {
            if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao buscar os administradores'
            });
        }
    },

    /**
     * ? Retorna um Admin a partir de um ID.
     * ---
     * @return {admin} (object) dados do Administrador.
     */
    async getById(req, res) {
        const { id } = req.params;

        try {
            const admin = await aulaDB('team')
                .select('id', 'email', 'status', 'type')
                .first()
                .where({ id });

            return res.status(200).json(admin);

        } catch (error) {
            if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao buscar um administrador'
            });
        }
    },

    /**
     * ? Registra um Admin no banco.
     * ---
     * @return {message} (str) Mensagem de sucesso.
     */
    async register(req, res) {
        const { email, password } = req.body;

        try {
            const schema = yup.object({
                email: yup.string().required()
                    .matches(/^\S+@\S+\.\S+$/, 'Digite um email válido.'),
                password: yup.string().required()
            });

            schema.validateSync({ email, password });
            
            const verifyEmail = await aulaDB('team')
                .select('email')
                .first()
                .where({ email });

            if (verifyEmail) {
                return res.status(422).json({
                    status: 422,
                    message: 'Já existe um admin registrado com este email.'
                })
            };

            await aulaDB('team')
                .insert({
                    email,
                    password: md5(password)
                });

            return res.status(201).json({
                status: 'Success',
                message: 'Novo administrador registrado com sucesso!'});

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
     * ? Edita um Admin no banco.
     * ---
     * @return {message} (str) Mensagem de sucesso.
     */
    async edit(req, res) {
        const { id } = req.params;
        const { password, status, type } = req.body;
        let newPass;

        try {
            if (status) {
                if (status !== 'active' && status !== 'inactive') {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro status com valor inválido. Tente active ou inactive'
                    });
                };
            };

            if (type) {
                if (type !== 'admin' && type !== 'master') {
                    return res.status(400).json({
                        status: 'Bad Request',
                        message: 'Parâmetro type com valor inválido. Tente admin ou master'
                    });
                }
            };

            if (password) {
                newPass = md5(password)
            }

            const body = {
                password: newPass,
                status,
                type
            }

            await aulaDB('team')
                .update(body)
                .where({ id });

            return res.status(200).json({
                status: 'Success',
                message: 'Informações alteradas com sucesso!'
            });

        } catch (error) {
            if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao editar o administrador'
            });
        }
    },

    /**
     * ? Deleta um Admin do banco.
     * ---
     * @return {message} (str) Mensagem de sucesso.
     */
    async delete(req, res) {
        const { id } = req.params;

        try {
            await aulaDB('team')
            .delete()
            .where({ id });

            return res.status(200).json({
                status: 'Success',
                message: 'Administrador deletado com sucesso!'
            });
            
        } catch (error) {
            if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao deletar o administrador'
            });
        }
    },

    /**
     * ? Busca todas as permissões disponíveis.
     * ---
     * @return {permissions} (arr) Lista de permissões.
     */
    async getAllPermissions(req, res) {

        try {
            const permissions = await aulaDB('permissions')
            .select()

            return res.status(200).json(permissions);
            
        } catch (error) {
             if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao buscar as permissões'
            });
        }
    },

    /**
     * ? Busca todas as permissões de um usuário.
     * ---
     * @return {permissions} (arr) Lista de permissões.
     */
    async getUserPermissions(req, res) {
        const { id } = req.query;

        try {
            if(!id){
                return res.status(400).json({
                    status: 'Incorrect Param',
                    message: 'Deve selecionar um id de usuário'
                })
            };

            const permissions = await aulaDB('user_permissions')
            .join('permissions', 'permissions.id', 'user_permissions.permission')
            .select('permission', 'description')
            .where('user', id);

            return res.status(200).json(permissions);

        } catch (error) {
            if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao buscar as permissões do administrador'
            });
        }
    },

    /**
     * ? Adiciona uma nova permissão ao usuário.
     * ---
     * @return {message} (arr) Mensagem de sucesso.
     */
    async postPermission(req, res) {
        const { user,  permission } = req.body;

        try {
            await aulaDB('user_permissions')
            .insert({
                user,
                permission
            });

            return res.status(201).json({
                status: 'Success',
                message: 'Permissão liberada com sucesso!'
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
                message: 'Tivemos problemas ao inserir a permissão do administrador'
            });
        }
    },

    /**
     * ? Deleta uma permissão do usuário.
     * ---
     * @return {message} (arr) Mensagem de sucesso.
     */
    async deletePermission(req, res) {
        const { permission } = req.params;
        const { user } = req.query;

        try {
            await aulaDB('user_permissions')
            .delete()
            .where({permission})
            .andWhere({user});

            return res.status(200).json({
                status: 'Success',
                message: 'Permissão removida com sucesso!'
            });
            
        } catch (error) {
            if (error.name) {
                return res.status(400).json({
                    status: error.name,
                    message: error.message
                })
            };
            return res.status(400).json({
                status: 'Error',
                message: 'Tivemos problemas ao remover a permissão do administrador'
            });
        }
    },
}