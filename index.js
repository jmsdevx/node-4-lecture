require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 5050;
const massive = require("massive");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { json } = require("body-parser");

app.use(json());

//generate salt, (built in to hashSync)
// const salt = bcrypt.genSaltSync(12);

//generate hash, pass params password and # of rounds to salt
// const hash = bcrypt.hashSync("password", 12);
// console.log(hash);

//how to compare db hash with new incoming hash
// console.log(bcrypt.compareSync("password", hash));

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: false
  })
);

massive(process.env.CONNECTION_STRING).then(dbInstance => {
  dbInstance.query(
    "CREATE TABLE IF NOT EXISTS auth_user (username VARCHAR(30), password TEXT);"
  );
  console.log("Database connected");
  app.set("db", dbInstance);
});

//register new user
app.post("/auth/register", async (req, res, next) => {
  const db = req.app.get("db");
  //try-catch-error handling
  try {
    //create hash of password
    const password = await bcrypt.hashSync(req.body.password, 12);

    //insert username / hashed pass into db
    const response = await db.auth_user.insert({
      username: req.body.username,
      password: password
    });

    //put user on session
    req.session.user = { username: response.username };
    console.log("SESSION -- USERNAME: " + req.session.user.username);

    //return username
    res.json({ username: response.username });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error" });
  }
});

//login user
app.post("/auth/login", async (req, res) => {
  const db = req.app.get("db");

  //try - catch - error handling
  try {
    //find user in db
    const response = await db.auth_user.findOne({
      username: req.body.username
    });

    //check if user is found
    if (!response) {
      res.status(401).json({ error: "User not found." });
    } else {
      //compare login credentials with hashed db credentials
      const isCorrect = await bcrypt.compare(
        req.body.password,
        response.password
      );

      //check response of comparison
      if (isCorrect) {
        //add user to session
        req.session.user = { username: response.username };
        console.log("SESSION -- USERNAME: " + req.session.user.username);
        res.json(req.session.user);
      } else {
        res.status(401).json({ error: "Password is incorrect" });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
