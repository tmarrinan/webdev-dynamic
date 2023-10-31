import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const port = 8080;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(__dirname, 'public');
const templatePath = path.join(__dirname, 'templates');
let renderedTemplate = "";
let titleAbbr = "";

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
        let selectionModifier = "season, date, home_team, away_team, home_team_abbr, away_team_abbr, home_team_score, away_team_score, game_quality_rating, game_importance_rating FROM nhl_data WHERE ";
        if (queryOverride) {
            query = `SELECT ${selectionModifier} ${column} ${modifier};`
        } else {
            query = `SELECT ${selectionModifier} home_team_abbr = '${column}' OR away_team_abbr = '${column}';`
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
            titleAbbr = "Very High"
            break;

        case "low":
            queryModifier = `>= 20 AND ${column} < 40;`
            titleAbbr = "Low";
            break;

        case "medium":
            queryModifier = `>= 40 AND ${column} < 60;`
            titleAbbr = "Medium";
            break;
            
        case "high":
            queryModifier = `>= 60 AND ${column} < 80;`
            titleAbbr = "High";
            break;
        case "veryhigh":
            queryModifier = ">= 80;"
            titleAbbr = "Very High";
            break;
        
        default:
            queryModifier = ">0" //return all
    };

    return queryModifier;
}


function renderTemplate(route, data, userInput) {

    return new Promise((resolve, reject) => {
        template.then((template) => {
            if (route == "team") {
                let teamName = mapName(userInput, data);
                title = `Game Data for ${teamName}`;
                renderedTemplate = template.replace('##TITLE##', title);
                resolve(renderedTemplate);

            } else if (route == "quality") {
                title = `Showing Data For ${titleAbbr} Quality Games `;
                renderedTemplate = template.replace('##TITLE##', title);
                resolve(renderedTemplate);
            } else if (route == "importance") {
                title = `Showing Data For ${titleAbbr} Importance Games `;
                renderedTemplate = template.replace('##TITLE##', title);
                resolve(renderedTemplate);
            }
            
            reject();
        });        
    });

    
}

function mapName(inputAbbr, data) { 

    if (inputAbbr == data[0].home_team_abbr) {
         return data[0].home_team;
    } else {
        return data[0].away_team;
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
        renderTemplate("team", data, teamAbbr).then(() => {
        res.status(200).type('html').send(renderedTemplate);         
        });
    });
    
});

app.get('/quality/:quality', async (req, res) => {   
    let column = "game_quality_rating";
    let quality = req.params.quality.toLowerCase();
    let queryModifier = abbreviationMapper(quality, column);
    let rows = queryDatabase(column, queryModifier, true);
    rows.then(() => {
        renderTemplate("quality", rows, quality).then(() => {
            res.status(200).type('html').send(renderedTemplate);         
        });
    });    
});

app.get('/importance/:importance', async (req, res) => {   
    let column = "game_importance_rating";
    let importance = req.params.importance.toLowerCase();
    let queryModifier = abbreviationMapper(importance, column);
    let rows = queryDatabase(column, queryModifier, true);
    rows.then(() => {
        renderTemplate("importance", rows, importance).then(() => {
            res.status(200).type('html').send(renderedTemplate);         
        });
    }); 
});

app.listen(port, () => {
    console.log('http://localhost:8080');
});
