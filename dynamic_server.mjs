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

app.get('/seasons', (req, res) => {
  console.log('Now listening on port ' + port);
 const imageMap = {
    Spring: '/springImg.jpg',
    Summer: '/summerImg.jpg',
    Header: '/washingtonImgSeasons.jpg'
  };

  const altMap = {
    Spring: 'Photo of spring time',
    Summer: 'Photo of summer time',
    Header: 'Photo of Downtown Washington'
  };
  
  let sql = `SELECT CTYNAME, 
  ROUND(Spring, 1) AS Spring, 
  ROUND(Summer, 1) AS Summer, 
  STNAME FROM climateChange 
  WHERE STNAME = 'Washington' 
  ORDER BY CAST(Spring as REAL) DESC 
  LIMIT 8;`;
  console.log(sql);
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).type('txt').send('SQL Error');
    }
    else {
      const counties = rows.map(r => r.CTYNAME);
      const springTemps = rows.map(r => r.Spring);
      const summerTemps = rows.map(r => r.Summer);
      fs.readFile(path.join(template, "seasons.html"),{encoding: 'utf8'}, (err, data) => {
        if (err) {
        return res.status(500).send("Error reading template file");
      }
      let springList = '';
      let summerList = '';
      for (const row of rows) {
        springList += `<li>${row.CTYNAME}, ${row.STNAME} — ${row.Spring} degrees (C)</li>`;
        summerList += `<li>${row.CTYNAME}, ${row.STNAME} — ${row.Summer} degrees (C)</li>`;
      }

      let response = data
      .replaceAll("$$$SPRING_IMG_SRC$$$", imageMap.Spring)
      .replaceAll("$$$SPRING_IMG_ALT$$$", altMap.Spring)
      .replaceAll("$$$SUMMER_IMG_SRC$$$", imageMap.Summer)
      .replaceAll("$$$SUMMER_IMG_ALT$$$", altMap.Summer)
      .replaceAll("$$$SPRING_LIST$$$", springList)
      .replaceAll("$$$SUMMER_LIST$$$", summerList)
      .replaceAll("$$$HEADER_IMG_SRC$$$", imageMap.Header)
      .replaceAll("$$$HEADER_IMG_ALT$$$", altMap.Header)
      .replaceAll("$$$COUNTIES$$$", JSON.stringify(counties))
      .replaceAll("$$$SPRING_TEMPS$$$", JSON.stringify(springTemps))
      .replaceAll("$$$SUMMER_TEMPS$$$", JSON.stringify(summerTemps))
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