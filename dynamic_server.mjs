import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

import { default as express } from "express";
import { default as sqlite3 } from "sqlite3";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8000;
const root = path.join(__dirname, "public");
const template = path.join(__dirname, "templates");

let app = express();
app.use(express.static(root));

const db = new sqlite3.Database(
  path.join(__dirname, "equality.sqlite3"),
  sqlite3.OPEN_READONLY,
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully connected to database");
    }
  }
);

function dbSelect(query, params) {
  let p = new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        console.log(rows);
        resolve(rows);
      }
    });
  });
  return p;
}

app.get("/all", (req, res) => {
  console.log("trying!");
  let p1 = dbSelect("SELECT * FROM Equality");
  let p2 = fs.promises.readFile(path.join(template, "search.html"), "utf-8");
  Promise.all([p1, p2])
    .then((results) => {
      let equality_list = results[0];
      let response = results[1];
      let table_body = "";
      equality_list.forEach((equality) => {
        let table_row = "<tr>";
        table_row += `<td class="center-text">${equality.country}</td>`;
        table_row += `<td class="center-text">${equality.wei}</td>`;
        table_row += `<td class="center-text">${equality.weg}</td>`;
        table_row += `<td class="center-text">${equality.ggpi}</td>`;
        table_row += `<td class="center-text">${equality.ggpg}</td>`;
        table_row += `<td class="center-text">${equality.hdg}</td>`;
        table_row += `<td class="center-text">${equality.region}</td>`;
        table_row += "</tr>";
        table_body += table_row;
      });
      response = response.replace("$TABLE_DATA$", table_body);
      res.status(200).type("html").send(response);
    })
    .catch((error) => {
      res.status(404).type("txt").send(error);
    });
});

app.get("/weg/:group", (req, res) => {
  let group = req.params.group;
  console.log(group);
})



app.listen(port, () => {
  console.log("Now listening on port " + port);
});
