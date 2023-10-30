import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const port = 8000;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

let app = express();
app.use(express.static(root));

const db = new sqlite3.Database(path.join(__dirname, 'exoplanets.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
    if(err) {
        console.log('Error connecting to database');
    } else { 
        console.log('Successfully connected to database');
    }
});

function dbSelect(query, params) {
    let p = new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if(err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
    return p;
}

app.get('/pl_name/:name', (req, res) => {
    let planet = decodeURIComponent(req.params.name.toUpperCase());
    console.log(planet);
    let p1 = dbSelect('SELECT * FROM Planets WHERE UPPER(pl_name) = ?', [planet]);
    let p2 = fs.promises.readFile(path.join(template, 'temp.html'), 'utf-8');
    Promise.all([p1, p2]).then((results) => {
        let response = results[1].replace('$$PLANET_NAME$$', results[0][0].pl_name).replace('$$PLANET_NAME$$', results[0][0].pl_name);
        let table_body = '';
        results[0].forEach((planet) => {
            let table_row = '<tr>';

            table_row += '<td>' + planet.discoverymethod + '</td>\n';
            table_row += '<td>' + planet.disc_year + '</td>\n';
            table_row += '<td>' + planet.disc_facility + '</td>\n';
            table_row += '<td>' + planet.pl_orbper + '</td>\n';
            table_row += '<td>' + planet.pl_bmasse + '</td>\n';
            table_row += '<td>' + planet.sy_dist + '</td>\n';

            table_row += '</tr>\n';
            table_body += table_row;
        });
        response = response.replace('$$TABLE_BODY$$', table_body);
        res.status(200).type('html').send(response);
    }).catch((error) => {
        res.status(404).type('txt').send('File not found');
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
