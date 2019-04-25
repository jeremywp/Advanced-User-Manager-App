const express = require('express');
const pg = require('pg');
const path = require('path');
const uuidv4 = require('uuid/v4');
let bodyParser = require('body-parser');
const fs = require('fs');
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

let userlist = [];

let index;

passport.use(new GoogleStrategy({
    //options object
    clientID: '212287115940-hegjmhdk77pum3hd594cgkfbe4pljrcn.apps.googleusercontent.com',
    clientSecret: 'rg877QJHU__YEWaNYx_Ntp65',
    callbackURL: 'http://localhost:3000/auth/google/callback'
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

    let user = {"email": email, "first": first, "last": last, "age": age, "id": id};

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

   /* fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
        if (err) throw err;
        let obj = JSON.parse(data);
        for (let i = 0; i < obj.users.length; i++){
            userlist.push(obj.users[i].email);
        }

        console.log(userlist);
        if (userlist.indexOf(user.email) === -1) {
            obj.users.push(user);

            fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(obj), 'utf-8', (err) => {
                if (err) throw err;
                res.send(`User ${req.query.first} ${req.query.last} added, with email ${req.query.email}. <a href="userListing">User Listings</a>`);
            });
        } else {
            res.send(`That email is already in use. <a href="addUser">Add User</a>`)
        }
    });*/

});

app.get('/addUser', (req, res) => {
    res.render('addUser');
});

app.get('/userListing', (req, res) => {

    const text = 'select * from users';

    client.query(text, (err, result) => {
        if (err) {
            console.log(err.stack)
        } else {
            console.log(result.rows);
            res.render('userListing', {users: result.rows})
        }
    });

    /*fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
        if (err) throw err;
        let obj = JSON.parse(data);
        for (let i = 0; i < obj.users.length; i++){
            userlist.push(obj.users[i]);
        }
        res.render('userListing', {users: obj.users})
    });*/

   /* if (req.user && !userlist.some(user => user.displayName === req.user.displayName)) {
    userlist.push(req.user);
    console.log(req.user);

}
    else {
        res.send(`<a href='/'>Login again</a>`)
    }
*/

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

    /*fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
        if (err) throw err;
        let obj = JSON.parse(data);

        for (let i = 0; i < obj.users.length; i++) {
            if (obj.users[i].id === req.query.id) {
                targetUser = obj.users[i];
                index = i;
            }
        }
        res.render('editUser', {
            first: targetUser.first,
            last: targetUser.last,
            email: targetUser.email,
            age: targetUser.age,
            id: targetUser.id
        });
    });*/
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

    /*fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
        if (err) throw err;
        let obj = JSON.parse(data);

        obj.users.splice(index, 1, {"first": req.query.first, "last": req.query.last, "email": req.query.email, "age": req.query.age, "id": req.query.id});
        fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(obj), 'utf-8', (err) => {
            if (err) throw err;
            res.send(`User ${req.query.first} ${req.query.last} edited. <a href="userListing">User Listings</a>`);
        });
    });*/

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

   /* fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
        if (err) throw err;
        let obj = JSON.parse(data);

        for (let i = 0; i < obj.users.length; i++){
            if (obj.users[i].id === req.query.id){
                obj.users.splice(i, 1);

            }
        }

        fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(obj), 'utf-8', (err) => {
            if (err) throw err;
            res.send(`User ${req.query.first} ${req.query.last} deleted. <a href="userListing">User Listings</a>`);
        });

    });*/

});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});