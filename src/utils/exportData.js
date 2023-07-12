const fs = require('fs');
const fastCsv = require('fast-csv')
import formatHtml from '../utils/formatHtlm';
import { Parser } from '@json2csv/plainjs';

export default function 
    exportData(response, title) {
        let lines = [];

        try {
            // const ws = fs.createWriteStream(`./exports/aulalivre_${title}.csv`, { encoding: 'utf8' });


            for (let line of response) {

                if (line.content) {
                    line.content = formatHtml(line.content);
                }
                
                lines.push(line)
            }

            // fastCsv.write(lines, { headers: true, delimiter: ';', quote: '"', writeBOM: true, encoding: 'utf8'}).pipe(ws)

            // return ws;

            const opts = { delimiter: ';', quote: '"', withBOM: true }

            const json2csv = new Parser(opts);
            const csv = json2csv.parse(lines);

            return {
                file: title,
                content: csv
            }

        } catch (error) {
            return {
                status: 'error',
                error
            }
        }
    };