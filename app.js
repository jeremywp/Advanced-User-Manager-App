const express = require('express');
const pg = require('pg');
const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mtech';

const client = new pg.Client(connectionString);
client.connect();

//Create -- new document
app.post('/newUser', (req, res) => {
    console.log(`POST /newUser: ${JSON.stringify(req.body)}`);
    let name = req.body.name;
    let age = req.body.age;
    let role = req.body.role;
    const text = 'INSERT into users (name, age, role) VALUES($1, $2, $3) RETURNING *';
    const values =  [name, age, role];

    // callback
    client.query(text, values, (err, result) => {
      if (err) {
        console.log(err.stack)
      } else {
        console.log(result.rows[0]);
        res.send(`done ${result.rows[0].name}`);
      }
    })
 });//  test this with `curl --data "name=Peter&role=Student&age=24" http://localhost:8080/newUser`

app.get('/user/:name', (req, res) => {
  let userName = req.params.name;
  console.log(`GET /user/:name ${JSON.stringify(req.params)}`);

  const text = 'select * from users where name = $1 RETURNING *';
  const values =  [userName];

  client.query(text, values, (err, result) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(result.rows[0]);
      res.send(`done ${result.rows[0].name}`);
    }
  })
});