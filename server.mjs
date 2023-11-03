import * as fs from 'node:fs'
import * as path from 'node:path';
import * as http from 'node:http';
import * as url from 'node:url';
import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const port = 8000;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

let app = express();
app.use(express.static(root));

const db = new sqlite3.Database(path.join(__dirname, 'candy.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
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

let query1 = "SELECT * FROM candy WHERE sugarpercent < 0.25 ORDER BY sugarpercent"
let query2 = "SELECT * FROM candy WHERE chocolate == 1 AND winpercent > 0.7 ORDER BY winpercent DESC"
let query3 = "SELECT * FROM candy WHERE fruity == 1 AND winpercent > 0.7 ORDER BY winpercent DESC"

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
        .replaceAll(/\s+/g, '-')           // Replace spaces with -
        .replaceAll(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replaceAll(/\-\-+/g, '-')         // Replace multiple - with single -
        .trim();                        // Trim - from start of text
}


//SUGAR PERCENT
app.get('/sugarpercent/:category', (req, res) => {

    let category = req.params.category;
    let sugarMin;
    let sugarMax;

    switch (category) {
        case 'low':
            sugarMin = 0;
            sugarMax = 0.3; // Assuming 'low' is sugarpercent < 0.1
            break;
        case 'medium':
            sugarMin = 0.3
            sugarMax = 0.6; // Assuming 'medium' is sugarpercent < 0.3
            break;
        case 'high':
            sugarMin = 0.6
            sugarMax = 1; // Assuming 'high' is sugarpercent < 0.5
            break;
        default:
            // Handle unknown category or set a default
            sugarMin = 0;
            sugarMax = 0.3;
            break;
    }
    // You don't need to perform a query with the candy name here since your queries don't use it.
    let p1 = dbSelect('SELECT * FROM candy WHERE sugarpercent < ? AND sugarpercent >= ? ORDER BY sugarpercent', [sugarMax, sugarMin]);
    let p2 = fs.promises.readFile(path.join(template, 'sugarpercent.html'), 'utf-8');

    Promise.all([p1, p2]).then(results => {
        // This is where you read the template and insert the data
        let template = results[1]; // This is your HTML template as a string.
        let response = template.replaceAll('$$CATEGORY_NAME$$', category); // Replace placeholder with candy name from URL.
        let nameList = []
        let namesList = []
        let percList = []
        // Now, insert the data from the database into the template.
        // Assuming you want to display the results from p1 in a table.
        let table_body = results[0].map((candy, index) => { // Use map to transform each row into an HTML row.
            const imageName = slugify(candy.competitorname) + '.jpg';
            const imagePath = `/images/${imageName}`;
            nameList.push(candy.competitorname);
            percList.push(parseFloat(candy.sugarpercent).toFixed(2))
            const imageTag = index === 0 ? `<img src="${imagePath}" alt="Image of ${candy.competitorname}" style="max-width:100px;max-height:100px;">` : '';
            response = response.replaceAll('$$FEATURED_IMAGE$$', imageTag);
            response = response.replaceAll('$$IMAGE_CAPTION$$', candy.competitorname);
            return `<tr>
                <td>${candy.competitorname}</td>
                <td>${parseFloat(candy.sugarpercent).toFixed(2) + '%'}</td>
                <td>${convertToYesNo(candy.chocolate)}</td>
                <td>${convertToYesNo(candy.fruity)}</td>
                <td>${convertToYesNo(candy.peanutyalmondy)}</td>
                <td>${convertToYesNo(candy.caramel)}</td>
                <td>${convertToYesNo(candy.pluribus)}</td>
            </tr>`;
        }).join(''); // Join all the strings into one big string.
        for (let i = 1; i < nameList.length; i++) {
            namesList.push(i)
        }
        response = response.replaceAll('$$NAMES$$', namesList);
        response = response.replaceAll('$$VALUES$$', percList);
        response = response.replaceAll('$$TABLE_BODY$$', table_body); // Replace the table body placeholder.
        //  response = response.replace('$$FEATURED_IMAGE$$', imageTag);

        res.status(200).type('html').send(response); // Send the response.
    }).catch((error) => {
        console.error(error);
        res.status(500).send("An error occurred on the server.");
    });
});


//WIN PERCENT
app.get('/winpercent/:category', (req, res) => {

    let category = req.params.category;
    let winMin;
    let winMax;

    switch (category) {
        case 'low':
            winMin = 0;
            winMax = 40; // Assuming 'low' is sugarpercent < 0.1
            break;
        case 'medium':
            winMin = 40
            winMax = 60; // Assuming 'medium' is sugarpercent < 0.3
            break;
        case 'high':
            winMin = 60
            winMax = 100; // Assuming 'high' is sugarpercent < 0.5
            break;
        default:
            // Handle unknown category or set a default
            winMin = 60;
            winMax = 100;
            break;
    }
    // You don't need to perform a query with the candy name here since your queries don't use it.
    let p1 = dbSelect('SELECT * FROM candy WHERE winpercent < ? AND winpercent >= ? ORDER BY winpercent DESC', [winMax, winMin]);
    let p2 = fs.promises.readFile(path.join(template, 'winpercent.html'), 'utf-8');

    Promise.all([p1, p2]).then(results => {
        // This is where you read the template and insert the data
        let template = results[1]; // This is your HTML template as a string.
        let response = template.replaceAll('$$CATEGORY_NAME$$', category); // Replace placeholder with candy name from URL.
        let nameList = []
        let namesList = []
        let percList = []
        // Now, insert the data from the database into the template.
        // Assuming you want to display the results from p1 in a table.
        let table_body = results[0].map((candy, index) => { // Use map to transform each row into an HTML row.
            const imageName = slugify(candy.competitorname) + '.jpg';
            const imagePath = `/images/${imageName}`;
            nameList.push(candy.competitorname);
            percList.push(parseFloat(candy.winpercent).toFixed(1))
            const imageTag = index === 0 ? `<img src="${imagePath}" alt="${imageName}" style="max-width:100px;max-height:100px;">` : '';
            response = response.replaceAll('$$FEATURED_IMAGE$$', imageTag);
            return `<tr>
                <td>${candy.competitorname}</td>
                <td>${parseFloat(candy.winpercent).toFixed(1) + '%'}</td>
                <td>${convertToYesNo(candy.chocolate)}</td>
                <td>${convertToYesNo(candy.fruity)}</td>
                <td>${convertToYesNo(candy.peanutyalmondy)}</td>
                <td>${convertToYesNo(candy.caramel)}</td>
                <td>${convertToYesNo(candy.pluribus)}</td>
            </tr>`;
        }).join(''); // Join all the strings into one big string.
        for (let i = 1; i < nameList.length; i++) {
            namesList.push(i)
        }
        response = response.replaceAll('$$NAMES$$', namesList);
        response = response.replaceAll('$$VALUES$$', percList);
        response = response.replaceAll('$$TABLE_BODY$$', table_body); // Replace the table body placeholder.
        //  response = response.replace('$$FEATURED_IMAGE$$', imageTag);
        res.status(200).type('html').send(response); // Send the response.
    }).catch((error) => {
        console.error(error);
        res.status(500).send("An error occurred on the server.");
    });
});


//PRICE PERCENT
app.get('/pricepercent/:category', (req, res) => {

    let category = req.params.category;
    let priceMin;
    let priceMax;

    switch (category) {
        case 'low':
            priceMin = 0;
            priceMax = 0.3; // Assuming 'low' is sugarpercent < 0.1
            break;
        case 'medium':
            priceMin = 0.3
            priceMax = 0.6; // Assuming 'medium' is sugarpercent < 0.3
            break;
        case 'high':
            priceMin = 0.6
            priceMax = 1; // Assuming 'high' is sugarpercent < 0.5
            break;
        default:
            // Handle unknown category or set a default
            priceMin = 0;
            priceMax = 0.3;
            break;
    }
    // You don't need to perform a query with the candy name here since your queries don't use it.
    let p1 = dbSelect('SELECT * FROM candy WHERE pricepercent < ? AND pricepercent >= ? ORDER BY pricepercent', [priceMax, priceMin]);
    let p2 = fs.promises.readFile(path.join(template, 'pricepercent.html'), 'utf-8');

    Promise.all([p1, p2]).then(results => {
        // This is where you read the template and insert the data
        let template = results[1]; // This is your HTML template as a string.
        let response = template.replaceAll('$$CATEGORY_NAME$$', category); // Replace placeholder with candy name from URL.
        let nameList = []
        let namesList = []
        let percList = []
        // Now, insert the data from the database into the template.
        // Assuming you want to display the results from p1 in a table.
        let table_body = results[0].map((candy, index) => { // Use map to transform each row into an HTML row.
            const imageName = slugify(candy.competitorname) + '.jpg';
            const imagePath = `/images/${imageName}`;
            nameList.push(candy.competitorname);
            percList.push(parseFloat(candy.pricepercent).toFixed(2))
            const imageTag = index === 0 ? `<img src="${imagePath}" alt="${imageName}" style="max-width:100px;max-height:100px;">` : '';
            response = response.replaceAll('$$FEATURED_IMAGE$$', imageTag);
            return `<tr>
                <td>${candy.competitorname}</td>
                <td>${parseFloat(candy.pricepercent).toFixed(2) + '%'}</td>
                <td>${convertToYesNo(candy.chocolate)}</td>
                <td>${convertToYesNo(candy.fruity)}</td>
                <td>${convertToYesNo(candy.peanutyalmondy)}</td>
                <td>${convertToYesNo(candy.caramel)}</td>
                <td>${convertToYesNo(candy.pluribus)}</td>
            </tr>`;
        }).join(''); // Join all the strings into one big string.
        for (let i = 1; i < nameList.length; i++) {
            namesList.push(i)
        }
        response = response.replaceAll('$$NAMES$$', namesList);
        response = response.replaceAll('$$VALUES$$', percList);
        response = response.replaceAll('$$TABLE_BODY$$', table_body); // Replace the table body placeholder.
        //  response = response.replace('$$FEATURED_IMAGE$$', imageTag);
        res.status(200).type('html').send(response); // Send the response.
    }).catch((error) => {
        console.error(error);
        res.status(500).send("An error occurred on the server.");
    });
});

db.all(query1, (err, rows) => {
    if ((err) => {
        console.log(err)
    });
    else {            //res.json(rows)
        // rows.forEach(row => console.log(`${row.mfr} is ${row.name} `))
        data1 = rows;
        if (data1 !== null && data2 !== null && data3 !== null) {
            finishAndSend();
        }
    };
});

db.all(query2, (err, rows) => {
    if ((err) => {
        console.log(err)
    });
    else {            //res.json(rows)
        // rows.forEach(row => console.log(`${row.mfr} is ${row.name} `))
        data2 = rows;
        if (data1 !== null && data2 !== null && data3 !== null) {
            finishAndSend();
        }
    };
});

db.all(query3, (err, rows) => {
    if ((err) => {
        console.log(err)
    });
    else {            //res.json(rows)
        // rows.forEach(row => console.log(`${row.mfr} is ${row.name} `))
        data3 = rows;
        if (data1 !== null && data2 !== null && data3 !== null) {
            finishAndSend();
        }
    };
});



app.listen(port, () => {
    console.log('Now listening on port' + port);
});

function graphDraw(names, values) {

    var graphtrace = {
        type: 'scatter',
        x: names,
        y: values,
        mode: 'markers',
        name: '',
        marker: {
            color: 'rgb(255, 0, 0)',
            line: {
                color: 'rgb(0,0,255)',
                width: 1,
            },
            symbol: 'circle',
            size: 16
        }
    };

    var layout = {
        title: 'Candy Graph',
        xaxis: {
            showgrid: false,
            showline: true,
            linecolor: 'rgb(102, 102, 102)',
            titlefont: {
                font: {
                    color: 'rgb(204, 204, 204)'
                }
            },
            tickfont: {
                font: {
                    color: 'rgb(102, 102, 102)'
                }
            },
            autotick: false,
            dtick: 10,
            ticks: 'outside',
            tickcolor: 'rgb(102, 102, 102)'
        },
        margin: {
            l: 140,
            r: 40,
            b: 50,
            t: 80
        },
        legend: {
            font: {
                size: 10,
            },
            yanchor: 'middle',
            xanchor: 'right'
        },
        width: 600,
        height: 600,
        paper_bgcolor: 'rgb(254, 247, 234)',
        plot_bgcolor: 'rgb(254, 247, 234)',
        hovermode: 'closest'
    };

    return Plotly.newPlot("myGraph", graphtrace, layout);
};