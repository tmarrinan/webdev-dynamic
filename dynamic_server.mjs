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

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});

const db = new sqlite3.Database(path.join(__dirname, 'bad_drivers.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
    if(err) {
        console.log("Error connecting to database")
    }
    else {
        console.log("Successfully connected to database")
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
}

