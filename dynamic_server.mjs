import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express'; //npm install express;
import { default as sqlite3 } from 'sqlite3'; //npm install sqlite3;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8081;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');
let cities = [];

let app = express();
app.use(express.static(root));

const db = new sqlite3.Database('./data.sqlite3', sqlite3.OPEN_READONLY, (err) =>{
    if(err){
        console.log('Error connecting to database');
    }
    else{
        console.log('Sucessfully connected to database');

        //Get list of city names
        db.all('SELECT DISTINCT city FROM Weather', [], (err, rows) => {
            if (err) {
                console.error('DB error');
            }else{
            cities = rows.map(r => r.city).sort();
            console.log('Loaded cities:', cities);
            }
        });
    }
});



app.get('/', (req, res) => {
    console.log('### homepage');
    let index = null;

    let sendResponse = function() {
        console.log('### sendResponse');
        let temperatureLinks = '';
        let precipitationLinks = '';
        let windLinks = '';
        for (let i = 0; i < cities.length; i++) {
            temperatureLinks += `<li><a href="/temperature/${cities[i]}">${cities[i]}</a></li>`;
            precipitationLinks += `<li><a href="/precipitation/${cities[i]}">${cities[i]}</a></li>`;
            windLinks += `<li><a href="/wind/${cities[i]}">${cities[i]}</a></li>`;
        }
        index = index.replace('$$$ CITIES-TEMPERATURE $$$', temperatureLinks);
        index = index.replace('$$$ CITIES-PRECIPITATION $$$', precipitationLinks);
        index = index.replace('$$$ CITIES-WIND $$$', windLinks);
        res.status(200).type('html').send(index);
    }

    fs.readFile(path.join(template, 'index.html'), (err, data) => {
        console.log('### read index html');
        if (err) {
            res.status(404).type('text/plain').send('Error: file not found');
        } else {
            index = data.toString();
            sendResponse();
        }
    });
});


// Erin
app.get('/temperature/:city', (req, res) => {
    console.log('### city '+req.params.city);
    let json = null;
    let mfr = null;
    let html = null;


    fs.readFile(path.join(template, 'temperature.html'), {encoding: 'utf8'}, (err, data) => {
        console.log('### read temp html');
        if (err) {
            res.status(404).type('text/plain').send('Error: file not found');
        } else {
            html = data.toString();
            html = html.replace('$$$ CITY $$$', req.params.city);
            res.status(200).type('html').send(html);
        }
    });
});

// Harrison
app.get('/precipitation/:city', (req, res) => {
    console.log('### city '+req.params.city);
    let json = null;
    let mfr = null;
    let html = null;


    fs.readFile(path.join(template, 'precipitation.html'), {encoding: 'utf8'}, (err, data) => {
        console.log('### read precipitation html');
        if (err) {
            res.status(404).type('text/plain').send('Error: file not found');
        } else {
            html = data.toString();
            html = html.replace('$$$ CITY $$$', req.params.city);
            res.status(200).type('html').send(html);
        }
    });
});


// Kristina
app.get('/wind/:city', (req, res) => {
    console.log('### city '+req.params.city);
    let sql = 'SELECT year, avg_wind_speed FROM Weather WHERE city = ?';
    let city = req.params.city;

    db.all(sql, [city], (err, rows) =>{
        if(err){
            res.status(404).type('txt').send('Error: ' + city + ' wind data not found');

        } else{
            fs.readFile(path.join(template, 'wind.html'), {encoding: 'utf8'}, (err, data) => {
                if (err) {
                    res.status(404).type('text/plain').send('Error:' + city + ' Wind not found');
                } else {

                    console.log('### read wind html');

                    let windTable = '';
                    for(let i=0; i<rows.length;i++){
                        windTable += '<tr><td>' + rows[i].year + '</td>';
                        windTable += '<td>' + rows[i].avg_wind_speed + '</td></tr>'; 
                    }

                    let response = data.replace('$$$CITY$$$', city);
                    response = response.replace('$$$WIND_TABLE$$$', windTable);
                    res.status(200).type('html').send(response);
                }
            });
        }
    })
});



app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
