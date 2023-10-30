import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const port = 8000;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(__dirname, 'public');
const templatePath = path.join(__dirname, 'templates');
let renderedTemplate = "";

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
        let selectionModifier = "season, date, home_team, away_team, home_team_abbr, away_team_abbr, home_team_score, away_team_score, game_quality_rating, game_importance_rating FROM nhl_data WHERE home_team_abbr";
        if (queryOverride) {
            query = `SELECT ${selectionModifier} FROM nhl_data WHERE ${column} ${modifier};`
        } else {
            query = `SELECT ${selectionModifier} = '${column}' OR away_team_abbr = '${column}';`
        }

        db.all(query, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
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

function renderTemplate(route, data) {

    return new Promise((resolve, reject) => {
        template.then((template) => {
            if (route == "team") {
                console.log(data);
                renderedTemplate = template.replace('##TITLE##', title);
                resolve(renderedTemplate);
            }
            
            reject();
        });        
    });

    
}

function mapName(inputAbbr, data) {

    if (inputAbbr == data[0].home_team_abbr) {
        title = data[0].home_team;
    } else {
        title = data[0].away_team;
    }
}

app.get('/', async (req, res) => {   
    template.then((template) => {
        res.status(200).type('html').send(template);
    });     
});

app.get('/team/:team', (req, res) => {
    let teamAbbr = req.params.team.toUpperCase();
    let data = queryDatabase(teamAbbr);
    data.then((data) => {
        mapName(teamAbbr, data);
        renderTemplate("team", data).then(() => {
        res.status(200).type('html').send(renderedTemplate);         
        });
    });
    
});

app.get('/quality/:quality', async (req, res) => {   
    let column = "game_quality_rating";
    let queryModifier = abbreviationMapper(req.params.quality.toLowerCase(), column);
    let rows = queryDatabase(column, queryModifier, true);
    rows.then(() => console.log(rows));
    renderTemplate("team");
    template.then((template) => {
        res.status(200).type('html').send(template);
    });   
});

app.get('/importance/:importance', async (req, res) => {   
    let column = "game_importance_rating";
    let queryModifier = abbreviationMapper(req.params.importance.toLowerCase(), column);
    let rows = queryDatabase(column, queryModifier, true);
    rows.then(() => console.log(rows));
    renderTemplate("team");
    template.then((template) => {
        res.status(200).type('html').send(template);
    });
});

app.listen(port, () => {
    console.log('http://localhost:8000');
});
