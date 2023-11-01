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

    let state = req.params.name;

    let p1 = dbSelect("SELECT * FROM drivers WHERE State=?", [state]);
    let p2 = fs.promises.readFile(path.join(template, 'template2.html'), 'utf-8');
    Promise.all([p1, p2]).then((results) => {
        console.log(p1)
        let response = results[1].replace('$$STATENAME$$', results[0][0].State);
        results[0].forEach((row) => {
            response = response.replace('$$INPUT1$$', row["Number of drivers involved in fatal collisions per billion miles"]);
            response = response.replace('$$INPUT2$$', row["Percentage Of Drivers Involved In Fatal Collisions Who Were Speeding"]);
            response = response.replace('$$INPUT3$$', row["Percentage Of Drivers Involved In Fatal Collisions Who Were Alcohol-Impaired"]);
            response = response.replace('$$INPUT4$$', row["Percentage Of Drivers Involved In Fatal Collisions Who Were Not Distracted"]);
            response = response.replace('$$INPUT5$$', row["Percentage Of Drivers Involved In Fatal Collisions Who Had Not Been Involved In Any Previous Accidents"]);
            response = response.replace('$$INPUT6$$', row["Car Insurance Premiums ($)"]);
            response = response.replace('$$INPUT7$$', row["Losses incurred by insurance companies for collisions per insured driver ($)"]);
            let ID = row["ID"];
            console.log(ID);
            let IDplus = ID + 1;
            let IDminus = ID - 1;
            if (ID > 0 && ID < 51) {
                let p3 = dbSelect("SELECT State FROM drivers WHERE ID = ?", [IDplus]);
                Promise.all([p3]).then((results) => {
                results[0].forEach((row) => {
                    let NextState = row.State
                    console.log(NextState);
                    response = response.replace('$$NEXT$$', NextState);
                });
                }).catch((error) => {
                console.error("Error:", error); // Log the error for debugging
                res.status(404).type('txt').send('File not found !!!');
                });
            }   
            
            if (ID > 1 && ID <= 51) {
                let p4 = dbSelect("SELECT State FROM drivers WHERE ID=?", [(IDminus)]);
                response = response.replace('$$PREV$$', p4);
                }
            if (ID == 1) {
                response = response.replace('$$PREV$$', "")
                response = response.replace('Previous', "")
            }
            if (ID == 51) {
                response = response.replace('$$NEXT$$', "")
                response = response.replace('Next', "")
            }
            
        
        });  
        
        res.status(200).type('html').send(response);
    }).catch((error) => {
        console.error("Error:", error); // Log the error for debugging
        res.status(404).type('txt').send('File not found !!!');
    });
});


app.get('/Insurance/:frequency', (req, res) => { //Car insurance 

    let frequency = req.params.frequency;

    if ((frequency % 100) >= 50) {
        frequency = frequency - ((frequency % 100)) + 100
    }
    else {
        frequency = frequency - ((frequency % 100))
    }


    let p1 = dbSelect("SELECT State, [Car Insurance Premiums ($)] FROM drivers WHERE [Car Insurance Premiums ($)] > ?", [frequency]);
    let p2 = fs.promises.readFile(path.join(template, 'template1.html'), 'utf-8');
    Promise.all([p1, p2]).then((results) => {
        let response = results[1].replace('$$STATENAME$$', 'States with Insurance Premiums over ' + frequency + " (URL Rounded to Nearest 100)");
        let table_body = '';
        results[0].forEach((row) => {
            let table_row = '<tr>';
            table_row += '<td>' + row.State + '</td>';
            table_row += '<td>' + row["Car Insurance Premiums ($)"] + '</td>';
            table_row += '</tr>';
            table_body += table_row;
        });
        response = response.replace('$$TABLE_BODY$$', table_body);
        if (frequency <= 100) {
            response = response.replace('$$PREV$$', "")
            response = response.replace('Previous', "")
        }
        response = response.replace('$$NEXT$$', (frequency+100))
        if (frequency >= 1300) {
            response = response.replace('$$NEXT$$', "")
            response = response.replace('Next', "")
        }
        response = response.replace('$$PREV$$', (frequency-100))
        res.status(200).type('html').send(response);
    }).catch((error) => {
        console.error("Error:", error); // Log the error for debugging
        res.status(404).type('txt').send('File not found !!!');
    });
});


app.get('/State/:name', (req, res) => {

    let state = req.params.name;

    let p1 = dbSelect("SELECT * FROM drivers WHERE State=?", [state]);
    let p2 = p1;
    let p3 = fs.promises.readFile(path.join(template, 'template1.html'), 'utf-8');
    Promise.all([p1, p2, p3]).then((results) => {
        console.log(p1)
        console.log(results[1][0].State)
        let response = results[2].replace('$$STATENAME$$', results[1][0].State);
        res.status(200).type('html').send(response);
    }).catch((error) => {
        console.error("Error:", error); // Log the error for debugging
        res.status(404).type('txt').send('File not found !!!');
    });
});


app.listen(port, () => {
    console.log('Now listening on port' + port);
});
