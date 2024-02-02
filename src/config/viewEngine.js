const express = require("express");
const handlebars = require("express-handlebars");
const path = require("path");
const Handlebars = require('handlebars')
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')
const session = require("express-session");
const bodyParser = require("body-parser");

const configViewEngine = (app) => {
  // set view engine
  app.engine(
    ".hbs",
    handlebars.engine({
      defaultLayout: "main",
      extname: ".hbs",
      handlebars: allowInsecurePrototypeAccess(Handlebars)
    })
  );

  app.set("view engine", ".hbs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.use(express.json());
  app.use(
    session({
      secret: "your-secret-key",
      resave: false,
      saveUninitialized: true,
    })
  );

  app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
  });
};

module.exports = configViewEngine;
