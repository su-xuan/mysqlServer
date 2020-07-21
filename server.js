require('dotenv').config();
const mysql = require("mysql");
const express = require("express");
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport(
  {
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS
    }
  }
);
const PORT = process.env.PORT || 3000;

const app = express();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB,
});

connection.connect(function (err) {
  err ? console.log(err) : console.log(connection);
});

require("./routes/html-routes")(app, connection, transporter);


app.listen(PORT, () => {
  console.log(`App listening on port: ${PORT}`);
});
