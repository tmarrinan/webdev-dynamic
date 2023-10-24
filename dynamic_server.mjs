import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const port = 8000;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

let app = express();
app.use(express.static(root));

const db = new sqlite3.Database(path.join(__dirname, 'nhl_data.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error connecting to database');
    }
    else {
        console.log('Successfully connected to database');
    }
});

app.get('/', (req, res) => {   
    console.log("HERE");
    fs.readFile(path.join(template, 'temp.html'), 'utf-8', (err, data) => {
        if (err) {
            res.status(400);
        }
        res.status(200).type('html').send(data);
    })
    
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
