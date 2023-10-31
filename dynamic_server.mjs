import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 2000;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

let app = express();
app.use(express.static(root));


const db = new sqlite3.Database(path.join(__dirname, 'bad_drivers_2.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
    if(err) {
        console.log("Error connecting to database")
    }
    else {
        console.log("Successfully connected to database")
    }
});

function dbSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}

app.get('/State/:name', (req, res) => {

    let state = req.params.name.toUpperCase();

    let p1 = dbSelect("SELECT * FROM drivers WHERE State=?", [state]);
    let p2 = p1;
    let p3 = fs.promises.readFile(path.join(template, 'template1.html'), 'utf-8');
    Promise.all([p1, p2, p3]).then((results) => {
        let response = results[2].replace('$$STATE_NAME$$', results[1][0].State);
        res.status(200).type('html').send(response);
    }).catch((error) => {
        console.error("Error:", error); // Log the error for debugging
        res.status(404).type('txt').send('File not found !!!');
    });
});


app.listen(port, () => {
    console.log('Now listening on port' + port);
});
