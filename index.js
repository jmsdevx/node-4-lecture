require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 5050;
const massive = require("massive");

massive(process.env.CONNECTION_STRING).then(dbInstance => {
  dbInstance.query(
    "CREATE TABLE IF NOT EXISTS auth_user (username VARCHAR(30), password TEXT);"
  );
  console.log("Database connected");
  app.set("db", dbInstance);
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
