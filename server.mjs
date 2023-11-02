import * as fs from 'node:fs'
import * as path from 'node:path';
import * as http from 'node:http';
import * as url from 'node:url';
import {default as express} from 'express';
import {default as sqlite3} from 'sqlite3';

const port=8000;
const __dirname= path.dirname(url.fileURLToPath(import.meta.url));
const root=path.join(__dirname,'public');
const template = path.join(__dirname,'templates');

let app=express();
app.use(express.static(root));

const db = new sqlite3.Database(path.join(__dirname,'candy.sqlite3'),sqlite3.OPEN_READONLY, (err)=>{
    if(err){
        console.log('Error connecting to database');
    }
    else{
        console.log('Successfully connected to database');
    }});

function dbSelect(query,params){
    let p = new Promise((resolve, reject)=>{
        db.all(query, params, (err,rows)=>{
            if (err){
                reject(err);
            }
            else{
                resolve(rows);
            }
        });
    });
    return p;
}   

let query1="SELECT * FROM candy WHERE sugarpercent < 0.25 ORDER BY sugarpercent"
let query2="SELECT * FROM candy WHERE chocolate == 1 AND winpercent > 0.7 ORDER BY winpercent DESC"
let query3="SELECT * FROM candy WHERE fruity == 1 AND winpercent > 0.7 ORDER BY winpercent DESC"

app.get('/', (req, res) => {
    // Send the index.html file when the homepage is accessed
    res.sendFile(path.join(template, 'index.html'), 'utf-8');
});

//function to convert 1 and 0 to yes and no for table data displayed on web page
function convertToYesNo(value) {
    return value === 1 ? 'Yes' : 'No';
}

//for making candy names able to be read as fils
function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .trim();                        // Trim - from start of text
  }
  

//SUGAR PERCENT
app.get('/lowSugar', (req, res) => {
    // You don't need to perform a query with the candy name here since your queries don't use it.
    let p1 = dbSelect('SELECT * FROM candy WHERE sugarpercent < 0.25 ORDER BY winpercent DESC LIMIT 10');
    let p2 = dbSelect('SELECT * FROM candy WHERE chocolate == 1 ORDER BY winpercent DESC LIMIT 10');
    let p3 = dbSelect('SELECT * FROM candy WHERE fruity == 1 ORDER BY winpercent DESC LIMIT 10');
    let p4 = fs.promises.readFile(path.join(template, 'lowSugar.html'), 'utf-8');

    Promise.all([p1, p2, p3, p4]).then(results => {
        // This is where you read the template and insert the data
        let template = results[3]; // This is your HTML template as a string.
        let response = template.replace('$$CANDY_NAME$$', req.params.name); // Replace placeholder with candy name from URL.
        
        // Now, insert the data from the database into the template.
        // Assuming you want to display the results from p1 in a table.
        let table_body = results[0].map(candy => { // Use map to transform each row into an HTML row.
            const imageName = slugify(candy.competitorname) + '.jpg';
            const imagePath = `/images/${imageName}`;
            return `<tr>
                <td>${candy.competitorname}</td>
                <td>${parseFloat(candy.winpercent).toFixed(0)+'%'}</td>
                <td>${parseFloat(candy.sugarpercent).toFixed(2)}</td>
                <td>${convertToYesNo(candy.chocolate)}</td>
                <td>${convertToYesNo(candy.fruity)}</td>
                <td>${convertToYesNo(candy.peanutyalmondy)}</td>
                <td>${convertToYesNo(candy.hard)}</td>
                <td>${convertToYesNo(candy.pluribus)}</td>
                <td><img src="${imagePath}" alt="Image of ${imagePath}" style="max-width:0.3 rem;max-height:0.3 rem;"></td>
            </tr>`;
        }).join(''); // Join all the strings into one big string.

        response = response.replace('$$TABLE_BODY$$', table_body); // Replace the table body placeholder.

        res.status(200).type('html').send(response); // Send the response.
    }).catch((error) => {
        console.error(error);
        res.status(500).send("An error occurred on the server.");
    });
});


//CHOCOLATE
app.get('/chocolate', (req, res) => {
    // You don't need to perform a query with the candy name here since your queries don't use it.
    let p1 = dbSelect('SELECT * FROM candy WHERE sugarpercent < 0.25 ORDER BY winpercent DESC LIMIT 10');
    let p2 = dbSelect('SELECT * FROM candy WHERE chocolate == 1 ORDER BY winpercent DESC LIMIT 10');
    let p3 = dbSelect('SELECT * FROM candy WHERE fruity == 1 ORDER BY winpercent DESC LIMIT 10');
    let p4 = fs.promises.readFile(path.join(template, 'chocolate.html'), 'utf-8');

    Promise.all([p1, p2, p3, p4]).then(results => {
        // This is where you read the template and insert the data
        let template = results[3]; // This is your HTML template as a string.
        let response = template.replace('$$CANDY_NAME$$', req.params.name); // Replace placeholder with candy name from URL.

        // Now, insert the data from the database into the template.
        // Assuming you want to display the results from p1 in a table.
        let table_body = results[1].map(candy => { // Use map to transform each row into an HTML row.
            return `<tr>
                <td>${candy.competitorname}</td>
                <td>${parseFloat(candy.winpercent).toFixed(0)+'%'}</td>
                <td>${convertToYesNo(candy.peanutyalmondy)}</td>
                <td>${convertToYesNo(candy.nougat)}</td>
                <td>${convertToYesNo(candy.bar)}</td>  
                <td>${convertToYesNo(candy.pluribus)}</td>
            </tr>`;
        }).join(''); // Join all the strings into one big string.

        response = response.replace('$$TABLE_BODY$$', table_body); // Replace the table body placeholder.

        res.status(200).type('html').send(response); // Send the response.
    }).catch((error) => {
        console.error(error);
        res.status(500).send("An error occurred on the server.");
    });
});


//FRUITY
app.get('/fruity', (req, res) => {
    // You don't need to perform a query with the candy name here since your queries don't use it.
    let p1 = dbSelect('SELECT * FROM candy WHERE sugarpercent < 0.25 ORDER BY winpercent DESC LIMIT 10');
    let p2 = dbSelect('SELECT * FROM candy WHERE chocolate == 1 ORDER BY winpercent DESC LIMIT 10');
    let p3 = dbSelect('SELECT * FROM candy WHERE fruity == 1 ORDER BY winpercent DESC LIMIT 10');
    let p4 = fs.promises.readFile(path.join(template, 'fruity.html'), 'utf-8');

    Promise.all([p1, p2, p3, p4]).then(results => {
        // This is where you read the template and insert the data
        let template = results[3]; // This is your HTML template as a string.
        let response = template.replace('$$CANDY_NAME$$', req.params.name); // Replace placeholder with candy name from URL.

        // Now, insert the data from the database into the template.
        // Assuming you want to display the results from p1 in a table.
        let table_body = results[2].map(candy => { // Use map to transform each row into an HTML row.
            return `<tr>
                <td>${candy.competitorname}</td>
                <td>${parseFloat(candy.winpercent).toFixed(0)+'%'}</td>
                <td>${convertToYesNo(candy.hard)}</td>
                <td>${convertToYesNo(candy.bar)}</td>  
                <td>${convertToYesNo(candy.pluribus)}</td>
            </tr>`;
        }).join(''); // Join all the strings into one big string.

        response = response.replace('$$TABLE_BODY$$', table_body); // Replace the table body placeholder.

        res.status(200).type('html').send(response); // Send the response.
    }).catch((error) => {
        console.error(error);
        res.status(500).send("An error occurred on the server.");
    });
});

db.all(query1,(err,rows)=>{
    if ((err)=>{
        console.log(err)
    });
    else{            //res.json(rows)
        // rows.forEach(row => console.log(`${row.mfr} is ${row.name} `))
        data1=rows;
        if(data1 !==null && data2 !==null && data3 !==null){
            finishAndSend();
        }
    };
});

db.all(query2,(err,rows)=>{
    if ((err)=>{
        console.log(err)
    });
    else{            //res.json(rows)
        // rows.forEach(row => console.log(`${row.mfr} is ${row.name} `))
        data2=rows;
        if(data1 !==null && data2 !==null && data3 !==null){
            finishAndSend();
        }
    };
});

db.all(query3,(err,rows)=>{
    if ((err)=>{
        console.log(err)
    });
    else{            //res.json(rows)
        // rows.forEach(row => console.log(`${row.mfr} is ${row.name} `))
        data3=rows;
        if(data1 !==null && data2 !==null && data3 !==null){
            finishAndSend();
        }
    };
});

 

app.listen(port, () =>{
    console.log('Now listening on port'+port);
});