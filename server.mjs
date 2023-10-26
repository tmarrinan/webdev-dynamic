import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8000;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');
const css = path.join(__dirname, 'css');

let app = express();
app.use(express.static(root));

const db = new sqlite3.Database(path.join(__dirname, 'murders.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error connecting to database');
    }
    else {
        console.log('Successfully connected to database');
    }
});

function dbSelect(query, params) {
    let p = new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
    return p;
}

app.get('/murder-rate/under10', (req, res) => {
    let p1 = dbSelect("SELECT * FROM murders WHERE murders_2015 < 10");
    let p2 = fs.promises.readFile(path.join(template, 'template.html'), 'utf-8');
    let p3 = fs.promises.readFile(path.join(css, 'style.css'), 'utf-8');
    Promise.all([p1, p2, p3]).then((results) => {
        let tableBody = '';
        results[0].forEach((city) => {
            let tableRow = '<tr>';
            tableRow += '<td>' + city.city + '</td>';
            tableRow += '<td>' + city.state + '</td>';
            tableRow += '<td>' + city.murders_2015 + '</td>';
            tableRow += '<td>' + city.murders_2016 + '</td>';
            tableRow += '<td>' + city.change + '</td>';
            tableRow += '</tr>\n';
            tableBody += tableRow;
        });
        let style = "<style>" + results[2] + "</style>";
        let response = results[1].replace('$TITLE$', "Cities with under 10k murders").replace('$TABLEDATA$', tableBody).replace('<style></style>', style);
        res.status(200).type('html').send(response);
    }).catch((error) => {
        console.log(error);
        res.status(404).type('txt').send('File not found');
    });
})

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
