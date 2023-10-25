import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const port = 8000;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(__dirname, 'public');
const templatePath = path.join(__dirname, 'templates');

let app = express();
app.use(express.static(root));

let title = '';
const db = new sqlite3.Database(path.join(__dirname, 'nhl_data.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error connecting to database');
    }
    else {
        console.log('Successfully connected to database');
    }
});

let template = new Promise((resolve, reject) => {
    fs.readFile(path.join(templatePath, 'temp.html'), 'utf-8', (err, data) => {
        if (err) {
            reject(err);
        } else {
            resolve(data);
        }            
    })
});

function queryDatabase(column, modifier, queryOverride = false) {
    return new Promise((resolve, reject) => {
        let query;
        if (queryOverride) {
            query = `SELECT * FROM nhl_data WHERE ${column} ${modifier};`
        } else {
            query = `SELECT * FROM nhl_data WHERE home_team_abbr = '${column}' OR away_team_abbr = '${column}';`
        }

        console.log(query);
        db.all(query, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                //console.log(rows[0]);
                resolve(rows);
            }
        })
    })    
}

function abbreviationMapper(abbr, column) {

    let queryModifier;

    switch (abbr) {
        case "verylow":
            queryModifier = "< 20;"
            break;

        case "low":
            queryModifier = `>= 20 AND ${column} < 40;`
            break;

        case "medium":
            queryModifier = `>= 40 AND ${column} < 60;`
            break;
            
        case "high":
            queryModifier = `>= 60 AND ${column} < 80;`
            break;
        case "veryhigh":
            queryModifier = ">= 80;"
            break;
        
        default:
            queryModifier = ">0" //return all
    };

    return queryModifier;
}

function renderTemplate(data) {


}

function mapName(inputAbbr, data) {

    //console.log(data[0]);

    if (inputAbbr == data[0].home_team_abbr) {
        title = data[0].home_team;
    } else {
        title = data[0].away_team;
    }
    console.log("The team is :" + title);
}



app.get('/', async (req, res) => {   
    template.then((template) => {
        res.status(200).type('html').send(template);
    });     
});

app.get('/team/:team', (req, res) => {
    let teamAbbr = req.params.team.toUpperCase();
    let data = queryDatabase(teamAbbr);
    data.then(() => {
        console.log(data);
        mapName(teamAbbr, data);
    });
});

app.get('/quality/:quality', async (req, res) => {   
    let column = "game_quality_rating";
    let queryModifier = abbreviationMapper(req.params.quality.toLowerCase(), column);
    let rows = queryDatabase(column, queryModifier, true);
    rows.then(() => console.log(rows));
    template.then((template) => {
        res.status(200).type('html').send(template);
    });   
});

app.get('/importance/:importance', async (req, res) => {   
    let column = "game_importance_rating";
    let queryModifier = abbreviationMapper(req.params.importance.toLowerCase(), column);
    let rows = queryDatabase(column, queryModifier, true);
    rows.then(() => console.log(rows));
    template.then((template) => {
        res.status(200).type('html').send(template);
    });
});

app.listen(port, () => {
    console.log('http://localhost:8000');
});
