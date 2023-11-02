import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

import { default as express } from "express";
import { default as sqlite3 } from "sqlite3";
import { Console } from "node:console";

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
        //console.log(rows);
        resolve(rows);
      }
    });
  });
  return p;
}

app.get("/all", (req, res) => {
  console.log("trying! 1");
  let p1 = dbSelect("SELECT * FROM Equality");
  let p2 = fs.promises.readFile(path.join(template, "search.html"), "utf-8");
  Promise.all([p1, p2])
    .then((results) => {
      let equality_list = results[0];
      let response = results[1];
      let table_body = "";
      let data_string = "";
      equality_list.forEach((equality) => {
        let table_row = "<tr>";
        table_row += `<td class="center-text">${equality.country}</td>`;
        table_row += `<td class="center-text">${equality.wei}</td>`;
        table_row += `<td class="center-text">${equality.weg}</td>`;
        table_row += `<td class="center-text">${equality.ggpi}</td>`;
        table_row += `<td class="center-text">${equality.ggpg}</td>`;
        table_row += `<td class="center-text">${equality.hdg}</td>`;
        table_row += `<td class="center-text">${equality.region}</td>`;
        table_row += `<td class="center-text">${equality.population}</td>`;
        table_row += "</tr>";
        table_body += table_row;
        let data_row = "{";
        data_row += `x:${equality.wei},`;
        data_row += `y:${equality.ggpi},`;
        data_row += `r:${Math.pow(equality.population, 1 / 6)}`;
        data_row += "},";
        data_string += data_row;
      });
      response = response.replace("$TABLE_DATA$", table_body);
      response = response.replace("$PLOT_DATA$", data_string);
      res.status(200).type("html").send(response);
    })
    .catch((error) => {
      res.status(404).type("txt").send(error);
    });
});

app.get("/all", (req, res) => {
  console.log("trying! 2");
  let p1 = dbSelect("SELECT * FROM Equality");
  let p2 = fs.promises.readFile(path.join(template, "search.html"), "utf-8");
  Promise.all([p1, p2])
    .then((results) => {
      let data_list = results[0];
      let response = results[1];
      console.log(response);
      let data_string = "";
      data_list.forEach((equality) => {
        let data_row = "{";
        data_row += `x:${equality.wei},`;
        data_row += `y:${equality.ggpi},`;
        data_row += `r:${Math.pow(equality.population, 1 / 6)}`;
        data_row += "},";
        data_string += data_row;
        console.log(data_string);
      });
      response = response.replace("$PLOT_DATA$", data_string);
      console.log(response);
      res.status(200).type("html").send(response);
    })
    .catch((error) => {
      res.status(404).type("txt").send(error);
    });
});

app.get("/weg/:group", (req, res) => {
  console.log("trying!");
  let empowerment = req.params.group;
  let p1 = dbSelect("SELECT * FROM Equality WHERE weg = ?", [empowerment]);
  let p2 = fs.promises.readFile(
    path.join(template, "empowerment.html"),
    "utf-8"
  );
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
        table_row += `<td class="center-text">${equality.population}</td>`;
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

app.get("/ggpg/:group", (req, res) => {
  console.log("trying!");
  let parity = req.params.group;
  let p1 = dbSelect("SELECT * FROM Equality WHERE ggpg = ?", [parity]);
  let p2 = fs.promises.readFile(path.join(template, "parity.html"), "utf-8");
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
        table_row += `<td class="center-text">${equality.population}</td>`;
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

app.get("/region/:region", (req, res) => {
  console.log("trying!");
  let region = req.params.region;
  let p1 = dbSelect("SELECT * FROM Equality WHERE region = ?", [region]);
  let p2 = fs.promises.readFile(path.join(template, "region.html"), "utf-8");
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
        table_row += `<td class="center-text">${equality.population}</td>`;
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

app.listen(port, () => {
  console.log("Now listening on port " + port);
});
