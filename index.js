const express = require('express');
const pg = require('pg');
const path = require('path');
const uuidv4 = require('uuid/v4');
let bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const port = process.env.PORT || 8080;

const router = express.Router();

const app = express();

app.use(express.urlencoded({extended: false}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
      secret: 'some secret string',
      resave: false,
      saveUninitialized: false,
      cookie: {maxAge: 6e5}
  }
));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/users';
const client = new pg.Client(connectionString);
client.connect();

passport.use(new GoogleStrategy({
    //options object
    clientID: '212287115940-hegjmhdk77pum3hd594cgkfbe4pljrcn.apps.googleusercontent.com',
    clientSecret: 'rg877QJHU__YEWaNYx_Ntp65',
    callbackURL: 'http://localhost:8080/auth/google/callback'
}, (req, accessToken, refreshToken, profile, done) => {
    //callback
    done(null, profile);
}));

router.route('/google/callback')
    .get(passport.authenticate('google', {
        successRedirect: '/userListing',
        failure: '/'
    }));

router.route('/google')
    .get(passport.authenticate('google', {
        scope: ['profile']
    }));

app.use('/auth', router);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/create', (req, res) => {

    let email = req.query.email;
    let first = req.query.first;
    let last = req.query.last;
    let age = req.query.age;
    let id = uuidv4();

    const text = 'INSERT into users (email, first, last, age, id) VALUES($1, $2, $3, $4, $5) RETURNING *';
    const values = [email, first, last, age, id];

    client.query(text, values, (err, result) => {
        if (err) {
            console.log(err.stack)
        } else {
            console.log(result.rows[0]);
            res.send(`User ${req.query.first} ${req.query.last} added, with email ${req.query.email}. <a href="userListing">User Listings</a>`);
        }
    });
});

app.get('/addUser', (req, res) => {
    res.render('addUser');
});



app.get('/userListing', (req, res) => {
    let text = `select * from users order by last`;

    client.query(text, (err, result) => {
        if (err) {
            console.log(err.stack)
        } else {
            res.render('userListing', {users: result.rows})
        }
    });
});

app.get('/userListing/:column', (req, res) => {
    let text = `select * from users order by ${req.params.column}`;

    client.query(text, (err, result) => {
        if (err) {
            console.log(err.stack)
        } else {
            res.render('userListing', {users: result.rows})
        }
    });
});

app.get('/search', (req, res) => {

    console.log(req.query.search);

    const text = `select * from users where first ilike '%${req.query.search}%' or last ilike '%${req.query.search}%' or email ilike '%${req.query.search}%' or age ilike '%${req.query.search}%'`;

    client.query(text, (err, result) => {
        if (err) {
            console.log(err.stack)
        } else {
            console.log(result.rows);
            res.render('search', {users: result.rows})
        }
    });
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/editUser/:id', (req, res) => {
    let userName = req.params.id;
    console.log(`GET /editUser/:id ${JSON.stringify(req.params)}`);

    const text = 'select * from users where id = $1';
    const values =  [userName];

    client.query(text, values, (err, result) => {
        if (err) {
            console.log(err.stack)
        } else {
            console.log(result.rows[0]);
            res.render('editUser', {
                first: result.rows[0].first,
                last: result.rows[0].last,
                email: result.rows[0].email,
                age: result.rows[0].age,
                id: result.rows[0].id
            });
        }
    });
});

app.get(`/edit/`, (req, res) => {
    console.log(req.query);

    let email = req.query.email;
    let first = req.query.first;
    let last = req.query.last;
    let age = req.query.age;
    let id = req.query.id;

    console.log(`GET /edit/:id ${JSON.stringify(req.query)}`);

    const text = `update users set email = '${email}', first = '${first}', last = '${last}', age = ${age} where id = $1`;
    const values =  [id];

    client.query(text, values, (err, result) => {
        if (err) {
            console.log(err.stack)
        } else {
            console.log(req.query);
            res.send(`User ${req.query.first} ${req.query.last} edited. <a href="/userListing">User Listings</a>`);
        }
    });
});

app.get('/deleteUser/', (req, res) => {
    let userName = req.query.id;

    const text = 'delete from users where id = $1';
    const values =  [userName];

    client.query(text, values, (err, result) => {
        if (err) {
            console.log(err.stack)
        } else {
            res.send(`User deleted. <a href="/userListing">User Listings</a>`);
        }
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});