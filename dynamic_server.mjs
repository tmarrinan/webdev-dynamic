import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8080;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

let app = express();
app.use(express.static(root));

const db = new sqlite3.Database('./climateChange.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.log('Error connecting to database');
  }
  else {
    console.log('Successfully connected to database');
  }
});

// app.listen(port, (req, res) => {
//   console.log('Now listening on port ' + port);
    
//   let sql = 'SELECT * FROM Spring';
//   console.log(sql);
//   db.all(sql, [], (err, rows) => {
//     if (err) {
//       res.status(500).type('txt').send('SQL Error');
//     }
//     else {
//       fs.readFile(path.join(template, "seasons.html"),{encoding: 'utf8'}, (err, data) => {
//         if (err) {
//         return res.status(500).send("Error reading template file");
//       }
//       let mfr_list = '';
//       for(let i =0; i < rows.length; i++) {
//         mfr_list += '<li><a href="seasons/' + rows[i].id + '>';
//         mfr_list += rows[i].name + '"<a/><li>';
//       }
//       let response = data.replace('$$$SEASONS_HEADERS$$$', mfr_list);
//       res.status(200).type('html').send(response);
//       });
//     }
//   })
// });

app.get('/seasons.html', (req, res) => {
  console.log('Now listening on port ' + port);
    
  let sql = 'SELECT * FROM climateChange LIMIT 10';
  console.log(sql);
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).type('txt').send('SQL Error');
    }
    else {
      fs.readFile(path.join(template, "seasons.html"),{encoding: 'utf8'}, (err, data) => {
        if (err) {
        return res.status(500).send("Error reading template file");
      }
      let list = '';
      for (const row of rows) {
        list += `<li>${row.CTYNAME}, ${row.STNAME} — ${row.Annual}</li>`;
      }
      console.log("Number of rows:", rows.length);
console.log("HTML generated:", list);
      let response = data.replace(/\$\$\$SEASONS_HEADERS\$\$\$/g, list);
      res.status(200).type('html').send(response);
      });
    }
  })
});

app.get('/', (req, res) => {
  console.log('Now listening on port ' + port);
    
  let sql = 'SELECT * FROM climateChange LIMIT 10';
  console.log(sql);
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).type('txt').send('SQL Error');
    }
    else {
      fs.readFile(path.join(template, "index.html"),{encoding: 'utf8'}, (err, data) => {
        if (err) {
        return res.status(500).send("Error reading template file");
      }
      let list = '';
      for (const row of rows) {
        list += `<li>${row.CTYNAME}, ${row.STNAME} — ${row.Annual}</li>`;
      }
      console.log("Number of rows:", rows.length);
console.log("HTML generated:", list);
      let response = data.replace('$$$SEASONS_HEADERS$$$', list);
      res.status(200).type('html').send(response);
      });
    }
  })
});

app.listen(port, () => {
  console.log(`Now listening on port` + port);
})