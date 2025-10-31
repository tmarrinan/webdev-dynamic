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

app.get('/states', (req,res) => {
  let sql = `SELECT STNAME, 
            AVG(Annual) AS annual 
            FROM climateChange
            WHERE STNAME != 'STNAME'
            GROUP BY STNAME 
            ORDER BY annual DESC
            `;
  console.log(sql);

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).type('txt').send('SQL Error');
    }
    else {
      fs.readFile(path.join(template, "states.html"),{encoding: 'utf8'}, (err, data) => {
        if (err) {
          return res.status(500).send("Error reading template file");
        }
        let table = `
          <table style="width:100%; text-align: left;">
            <thead>
              <tr>
                <th style="border-bottom: 2px solid rgb(221, 221, 221);">State</th>
                <th style="border-bottom: 2px solid rgb(221, 221, 221);">Annual Temperature Change (°C) (1895-2019)</th>
              </tr>
            </thead>
            <tbody> 
        `;
        for (let row of rows) {
          let href = '/states/' + encodeURIComponent(row.STNAME);
          table += `
            <tr>
              <td style="border-bottom: 1px solid rgb(221, 221, 221);">
                <a href="${href}" style="color:#0074d9;">${row.STNAME}</a>
              </td>
              <td style="padding: 8px; border-bottom: 1px solid rgb(221, 221, 221);">
                ${parseFloat(row.annual).toFixed(3)}</td>
            </tr>
          `;
        }
        table += `
            </tbody>
          </table>
        `;

      let stateNamesArray = [];
      for (let i = 0; i < rows.length; i++) {
        stateNamesArray.push(rows[i].STNAME);
      }
      let stateNames = JSON.stringify(stateNamesArray);
      
      let annualValuesArray = [];
      for (let i = 0; i < rows.length; i++) {
        annualValuesArray.push(Number(rows[i].annual));
      }
      let annualValues = JSON.stringify(annualValuesArray);

      let chartScript = `
        <script>
          var states = ${stateNames};
          var annual = ${annualValues};

          var trace1 = {
            x: annual,
            y: states,
            name: 'Annual Change (°C)',
            orientation: 'h',
            type: 'bar',
            marker: {
            width: 1
            },
            type: 'bar'
          };

          var data = [trace1];

          var layout = {
            barmode: 'stack',
            margin: { l: 140, r: 20, t: 40, b: 40 },
            height: 800
          };

          Plotly.newPlot('states-chart', data, layout);
        </script>
      `;

      console.log("Number of rows:", rows.length);
      let response = data.replace('$$$STATES_TABLE$$$', table);
      response = response.replace('$$$STATES_CHART_SCRIPT$$$', chartScript);
      res.status(200).type('html').send(response);
      });
    }
  })
});

app.get('/states/:state', (req, res) => {
  let state = req.params.state;

  let sql = `
    SELECT STNAME, AVG(Annual) AS annual
    FROM climateChange
    WHERE STNAME != 'STNAME' AND LOWER(STNAME) = LOWER(?)
    GROUP BY STNAME
  `;
  db.get(sql, [state], (err, row) => {
    if (err) {
      return res.status(500).type('txt').send('SQL Error');
    }
    if (!row) {
      return res.status(404).type('txt').send('State ' + state + ' not found');
    }

    fs.readFile(path.join(template, 'state.html'), { encoding: 'utf8' }, (err, data) => {
      if (err) return res.status(500).send('Error reading template file');

      let content = `
        <h2>${row.STNAME}</h2>
        <p>Average Annual Temperature Change (1895-2019): <strong>${Number(row.annual).toFixed(3)}°C</strong></p>
        <p><a href="/states">Back to all states</a></p>
      `;

      let html = data.replace('$$$STATE_CONTENT$$$', content);
      res.status(200).type('html').send(html);
    });
  });
});


// ---------------- COUNTIES ----------------

// Shared queries
const sqlAnnual = `
  SELECT CTYNAME, STNAME, MAX(CAST(Annual AS REAL)) AS Annual
  FROM climateChange
  GROUP BY CTYNAME, STNAME
  ORDER BY Annual DESC
  LIMIT 5;
`;

const sqlDiff = `
  SELECT CTYNAME, STNAME,
         MAX(CAST(Summer AS REAL) - CAST(Winter AS REAL)) AS Diff
  FROM climateChange
  GROUP BY CTYNAME, STNAME
  ORDER BY Diff DESC
  LIMIT 5;
`;

const countyImageMap = {
  Table: '/countiesTable.jpg',
  Chart: '/countiesChart.jpg'
};

const countyAltMap = {
  Table: 'Map of U.S. counties with warming trends',
  Chart: 'Bar chart illustration of county climate change data'
};

// TABLE PAGE
app.get('/counties/table', (req, res) => {
  db.all(sqlAnnual, [], (err, rowsAnnual) => {
    if (err) return res.status(500).type('txt').send('SQL Error (Annual)');
    if (!rowsAnnual || rowsAnnual.length === 0) {
      return res.status(404).type('txt').send('Error: no data for counties');
    }

    db.all(sqlDiff, [], (err, rowsDiff) => {
      if (err) return res.status(500).type('txt').send('SQL Error (Diff)');
      if (!rowsDiff || rowsDiff.length === 0) {
        return res.status(404).type('txt').send('Error: no data for counties');
      }

      // Build Annual Table
      let tableAnnual = `<table><thead><tr><th>County</th><th>State</th><th>Annual Temp (°C)</th></tr></thead><tbody>`;
      rowsAnnual.forEach(r => {
        tableAnnual += `<tr><td>${r.CTYNAME}</td><td>${r.STNAME}</td><td>${Number(r.Annual).toFixed(2)}</td></tr>`;
      });
      tableAnnual += `</tbody></table>`;

      // Build Seasonal Table
      let tableDiff = `<table><thead><tr><th>County</th><th>State</th><th>Summer − Winter (°C)</th></tr></thead><tbody>`;
      rowsDiff.forEach(r => {
        tableDiff += `<tr><td>${r.CTYNAME}</td><td>${r.STNAME}</td><td>${Number(r.Diff).toFixed(2)}</td></tr>`;
      });
      tableDiff += `</tbody></table>`;

      const navLinks = `<span class="disabled">Previous</span> | <a href="/counties/chart">Next: Charts</a>`;

      fs.readFile(path.join(template, "counties_table.html"), "utf8", (err, data) => {
        if (err) return res.status(500).send("Error reading template file");
        let response = data
          .replace("$$$COUNTIES_TABLE_2019$$$", tableAnnual)
          .replace("$$$COUNTIES_TABLE_AVG$$$", tableDiff)
          .replace("$$$COUNTIES_NAV_LINKS$$$", navLinks)
          .replace("$$$COUNTY_IMG_SRC$$$", "/countiesmap.jpg")
          .replace("$$$COUNTY_IMG_ALT$$$", "Map of U.S. counties");
        res.status(200).type('html').send(response);
      });
    });
  });
});

// CHART PAGE
app.get('/counties/chart', (req, res) => {
  db.all(sqlAnnual, [], (err, rowsAnnual) => {
    if (err) return res.status(500).type('txt').send('SQL Error (Annual)');
    if (!rowsAnnual || rowsAnnual.length === 0) {
      return res.status(404).type('txt').send('Error: no data for counties');
    }

    db.all(sqlDiff, [], (err, rowsDiff) => {
      if (err) return res.status(500).type('txt').send('SQL Error (Diff)');
      if (!rowsDiff || rowsDiff.length === 0) {
        return res.status(404).type('txt').send('Error: no data for counties');
      }

      const countiesAnnual = rowsAnnual.map(r => `${r.CTYNAME}, ${r.STNAME}`);
      const valuesAnnual = rowsAnnual.map(r => r.Annual);

      const countiesDiff = rowsDiff.map(r => `${r.CTYNAME}, ${r.STNAME}`);
      const valuesDiff = rowsDiff.map(r => r.Diff);

      const chartScript = `
        <script>
          var traceAnnual = {
            x: ${JSON.stringify(valuesAnnual)},
            y: ${JSON.stringify(countiesAnnual)},
            orientation: 'h',
            type: 'bar',
            marker: { color: '#ff7f0e' }
          };
          var layoutAnnual = { title: 'Top 5 Counties by Annual Temperature Change (1895–2019)', margin: { l: 250, r: 40, t: 50, b: 50 }, height: 500 };
          Plotly.newPlot('chart-2019', [traceAnnual], layoutAnnual);

          var traceDiff = {
            x: ${JSON.stringify(valuesDiff)},
            y: ${JSON.stringify(countiesDiff)},
            orientation: 'h',
            type: 'bar',
            marker: { color: '#1f77b4' }
          };
          var layoutDiff = { title: 'Top 5 Counties with Largest Seasonal Difference', margin: { l: 250, r: 40, t: 50, b: 50 }, height: 500 };
          Plotly.newPlot('chart-avg', [traceDiff], layoutDiff);
        </script>
      `;

      const navLinks = `<a href="/counties/table">Previous: Tables</a> | <span class="disabled">Next</span>`;

      fs.readFile(path.join(template, "counties_chart.html"), "utf8", (err, data) => {
        if (err) return res.status(500).send("Error reading template file");
        let response = data
          .replace("$$$COUNTIES_CHART_SCRIPT$$$", chartScript)
          .replace("$$$COUNTIES_NAV_LINKS$$$", navLinks)
          .replace("$$$COUNTY_IMG_SRC$$$", "/countiesmap.jpg")
          .replace("$$$COUNTY_IMG_ALT$$$", "Map of U.S. counties");
        res.status(200).type('html').send(response);
      });
    });
  });
});


app.listen(port, () => {
  console.log(`Now listening on port ` + port);
})