import appIds from "../config/appIds";

module.exports = (req, res, next) => {
    const appIdHeader = req.headers['app-id'];

    //App ID header check.
    if (!appIdHeader)
        return res.status(401).json({
            status: "Erro",
            message: "Algo inesperado ocorreu. Contate o administrador do sistema.",
            error: "Missing parameters.",
    });

    //App ID header validation.
    if (!appIds.includes(appIdHeader))
        return res.status(403).json({
            status: "Erro",
            message: "Algo inesperado ocorreu. Contate o administrador do sistema.",
            error: "Unauthorized app access.",
    });

    return next();
};