import Knex from '../lib/Knex';
import moment from "moment";
import Mail from '../lib/Mail';
import fs from 'fs';
const fastcsv = require('fast-csv');

export default {

    async changeEncoding(req, res) {
        console.log("Inicio")
        // let today = moment();

        // const notificationDate = [1, 6, 11, 17, 21, 26, 3];
        // const day = parseInt(moment(today).format('D'));
        // const month = parseInt(moment(today).format('M'));
        // let dueDate;

        // let invoices = [];

        // // Meses que tem 31 dias
        // const biggerMonths = [1, 3, 5, 7, 8, 10, 12]

        // //Mês que tem 28 dias
        // const smallerMonth = [2]

        // if (biggerMonths.includes(month) && day > 15) {
        //     dueDate = today.add(15, 'days')
        // }
        // else if (smallerMonth.includes(month) && day > 15) {
        //     dueDate = today.add(12, 'days')
        // }
        // else
        //     dueDate = today.add(14, 'days')


        // if (notificationDate.includes(day)) {
  
        //     const fileName = `faturas_prati_${dueDate.format("DD_MM_YYYY")}.csv`
        //     const ws = fs.createWriteStream(fileName)

        //     dueDate = dueDate.format('YYYY/MM/DD')
        //     let invoices = [];

        //     //Busca os dados das faturas para envio externo
        //     const subquery = Knex('fn_areceber')
        //         .join('cliente as cli', 'fn_areceber.id_cliente', '=', 'cli.id')
        //         .join('fn_areceber_hist_boleto as hist', 'fn_areceber.id', '=', 'hist.id_areceber')
        //         .join('movimento_produtos as prod', 'fn_areceber.id_saida', '=', 'prod.id_saida')
        //         .select(
        //             //Dados do cliente
        //             { 'id_cliente': 'cli.id' },
        //             'cli.cnpj_cpf',
        //             Knex.raw('cli.endereco AS endereco'),
        //             Knex.raw('cli.numero AS numero'),
        //             Knex.raw('cli.complemento AS complemento'),
        //             Knex.raw('cli.cidade AS cidade'),
        //             Knex.raw('cli.bairro AS bairro'),
        //             Knex.raw('cli.cep AS cep'),
        //             Knex.raw('LEFT(cli.razao, 35) as nome'),
        //             //Contrato
        //             Knex.raw('CASE WHEN fn_areceber.id_contrato IS NULL || fn_areceber.id_contrato = 0 THEN fn_areceber.id_contrato_avulso ELSE fn_areceber.id_contrato END as id_contrato'),
        //             Knex.raw('CASE WHEN fn_areceber.id_saida = 0 THEN "Acordo de renegociação" WHEN fn_areceber.parcela_proporcional = "N" THEN GROUP_CONCAT(prod.descricao SEPARATOR "|") ELSE GROUP_CONCAT(LEFT(prod.descricao,LENGTH(prod.descricao) -29) SEPARATOR "|") END as prod_descricao'),
        //             Knex.raw('CASE WHEN fn_areceber.id_saida = 0 || prod.descricao = "Taxa de instalação" THEN replace(fn_areceber.valor,".",",") ELSE GROUP_CONCAT(replace(truncate(prod.valor_total, 2),".",",") SEPARATOR "|") END as prod_valor'),
        //             //Financeiro
        //             Knex.raw('CONCAT("R$ ", replace(fn_areceber.valor,".",",")) as valor'),
        //             Knex.raw('DATE_FORMAT(fn_areceber.data_vencimento, "%d/%m/%Y") as data_vencimento'),
        //             Knex.raw('DATE_FORMAT(fn_areceber.data_emissao, "%d/%m/%Y") as data_emissao'),
        //             { 'nr_doc': 'fn_areceber.id' },
        //             { 'nosso_numero': 'hist.bf_ourNumber' },
        //             'fn_areceber.linha_digitavel',
        //             'hist.pix_qr_code'
        //         )
        //         .where({
        //             'fn_areceber.id_carteira_cobranca': 2,
        //             'fn_areceber.liberado': 'S',
        //             'fn_areceber.status': 'A',
        //             'fn_areceber.tipo_cobranca': 'I',
        //             'fn_areceber.impresso': 'S'
        //         })
        //         .andWhereRaw(`fn_areceber.data_vencimento = '2023-02-01'`)
        //         .andWhereRaw('hist.bf_ourNumber is not null')
        //         .groupByRaw('hist.bf_ourNumber')
        //         .orderByRaw('cli.id')


        //     try {

        //         await Knex.select(
        //             'cliente.id_cliente',
        //             'cliente.nome',
        //             'cliente.cnpj_cpf',
        //             Knex.raw('UPPER(IFNULL( CONCAT(acesso.endereco,", ",acesso.numero," ",acesso.complemento) , CONCAT(cliente.endereco,", ",cliente.numero," ",cliente.complemento) )) AS endereco1'),
        //             Knex.raw('UPPER(IFNULL( CONCAT(acesso.cep, " ", cidade.nome, " ", uf.sigla ) , CONCAT(cliente.cep,", ",cidade.nome," ",uf.sigla)  )) AS endereco2'),
        //             'cliente.bairro',
        //             'cliente.id_contrato',
        //             'cliente.prod_descricao',
        //             'cliente.prod_valor',
        //             'cliente.valor',
        //             'cliente.data_vencimento',
        //             'cliente.data_emissao',
        //             'cliente.nr_doc',
        //             'cliente.nosso_numero',
        //             'cliente.linha_digitavel',
        //             'cliente.pix_qr_code'
        //         )
        //             .from(subquery.as('cliente'))
        //             .join('cidade', 'cliente.cidade', '=', 'cidade.id')
        //             .join('uf', 'cidade.uf', '=', 'uf.id')
        //             .leftJoin('radusuarios as acesso', function () {
        //                 this
        //                     .on('cliente.id_cliente', '=', 'acesso.id_cliente')
        //                     .andOn('acesso.id_contrato', '=', 'cliente.id_contrato')
        //             })
        //             .orderBy('acesso.endereco')
        //             .then(async rows => {
        //                 for (const invoice of rows) {

        //                     invoices.push(invoice)

        //                 }
        //             })
        //             console.log(invoices)

        //             fs.writeFile(ws, invoices, {
        //                 encoding: 'latin1'
        //             })
        //             fastcsv.write(invoices, 'latin1',{ headers: false, delimiter: ';', quote: '', writeBOM: false }).pipe(ws)

        //         // Notificação via email após conclusão
        //         // await Mail.sendMail({
        //         //     from: process.env.MAIL_FROM,
        //         //     to: process.env.MAIL_TO_NOTIFY,
        //         //     subject: `Job **fatura-dinamica** FINALIZADO`,
        //         //     html: `<p>
        //         //         <strong>Exportação de dados finalizada.</strong>
        //         //     <p/>`,
        //         //     attachments: [
        //         //         {
        //         //             filename: fileName,
        //         //             content: fs.createReadStream(fileName)
        //         //         }
        //         //     ]
        //         // })

        //         return res.status(200).json({
        //             status: "Success",
        //             invoices: invoices.length,
        //         });

        //     } catch (error) {
        //         console.log(error)
        //         return res.status(400).json({
        //             status: "Error",
        //             error
        //         });
        //     }
        // }
    },
}