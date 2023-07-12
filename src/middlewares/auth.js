import jwt from "jsonwebtoken";
import config from "../config/general";

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    //Authorization header check.
    if (!authHeader)
        return res.status(401).json({
            status: "Erro",
            message: "Algo inesperado ocorreu. Contate o administrador do sistema.",
            error: "Missing parameters. No token provided.",
    });

    //Authorization header parts check.
    const parts = authHeader.split(" ");

    if (!parts.length === 2)
        return res.status(401).json({
            status: "Erro",
            message: "Algo inesperado ocorreu. Contate o administrador do sistema.",
            error: "Token error.",
        });

    //Authorization header parts anatomy check.
    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme))
        return res.status(401).json({
            status: "Erro",
            message: "Algo inesperado ocorreu. Contate o administrador do sistema.",
            error: "Token malformatted.",
        });

    //Authorization header validation check.
    jwt.verify(token, config.authSecret, (err, decoded) => {
        if (err)
            return res.status(401).json({
                status: "Erro",
                message: "Seu acesso expirou. Será necessário fazer login novamente para continuar.",
                error: "Invalid or expired token.",
            });

        req.id = decoded.id;

        return next();
    });
};
