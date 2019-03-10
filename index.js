const express = require('express');
const path = require('path');
let bodyParser = require('body-parser');
const fs = require('fs');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const router = express.Router();

const app = express();

let userlist = [];

let index;

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

    let user = {"email": req.query.email, "first": req.query.first, "last": req.query.last, "age": req.query.age};

    fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
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
    });

});

app.get('/addUser', (req, res) => {
    res.render('addUser');
});

app.get('/userListing', (req, res) => {

    fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
        if (err) throw err;
        let obj = JSON.parse(data);
        for (let i = 0; i < obj.users.length; i++){
            userlist.push(obj.users[i]);
        }
        res.render('userListing', {users: obj.users})
    });

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

app.get('/users', (req, res) => {
    res.render('users');
});

app.get('/editUser*', (req, res) => {
    let targetUser;

    fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
        if (err) throw err;
        let obj = JSON.parse(data);

        for (let i = 0; i < obj.users.length; i++) {
            if (obj.users[i].first === req.query.first && obj.users[i].last === req.query.last) {
                targetUser = obj.users[i];
                index = i;
            }
        }
        res.render('editUser', {
            first: targetUser.first,
            last: targetUser.last,
            email: targetUser.email,
            age: targetUser.age
        });
    });
});

app.get('/edit*', (req, res) => {

    fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
        if (err) throw err;
        let obj = JSON.parse(data);

        obj.users.splice(index, 1, {"first": req.query.first, "last": req.query.last, "email": req.query.email, "age": req.query.age});
        fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(obj), 'utf-8', (err) => {
            if (err) throw err;
            res.send(`User ${req.query.first} ${req.query.last} edited. <a href="userListing">User Listings</a>`);
        });
    });

});

app.get('/deleteUser*', (req, res) => {

    fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
        if (err) throw err;
        let obj = JSON.parse(data);

        for (let i = 0; i < obj.users.length; i++){
            if (obj.users[i].first === req.query.first && obj.users[i].last === req.query.last){
                obj.users.splice(i, 1);

            }
        }

        fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(obj), 'utf-8', (err) => {
            if (err) throw err;
            res.send(`User ${req.query.first} ${req.query.last} deleted. <a href="userListing">User Listings</a>`);
        });

    });

});

app.listen(3000, () => {
    console.log("Listening on port 3000")
});