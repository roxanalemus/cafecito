const ObjectID = require('mongodb').ObjectID

module.exports = function (app, passport, db) {
  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get("/", function (req, res) {
    res.render("index.ejs");
  });

  app.get("/order", function (req, res) {
    res.render("order.ejs");
  });

  app.post("/order", (req, res) => {
    console.log(req.body);
    db.collection("coffeeOrders").insertOne(//method that allows you to insert one, and it won't update the collection
      {
      customerName: req.body.name,
      coffee: req.body.coffee,
      tea: req.body.tea,
      juice:req.body.juice,
      total: req.body.total,
      status:false,
      barista:null
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log(
          `saved to database: ${req.body.customerName} ${req.body.coffeeSmall}`
        );
        res.redirect("/order");
      }
    );
  });

  // PROFILE SECTION =========================
  app.get("/profile", isLoggedIn, function (req, res) {
    db.collection("coffeeOrders")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("profile.ejs", {
          user: req.user,
          coffeeOrders: result,
        });
      });
  });


  // // OLD ORDERS SECTION =========================
  // app.get("/oldOrders", function (req, res) {
  //   console.log({coffeeOrders: result})
  //   db.collection("coffeeOrders")
  //     .find({_id: ObjectID(req.body.id), status: true})
  //     .toArray((err, result) => {
  //       if (err) return console.log(err);
  //       res.render("oldOrders.ejs", {
  //         coffeeOrders: result,
  //       });
  //     });
  // });

  // LOGOUT ==============================
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  // message board routes ===============================================================

  app.put("/coffeeOrders", isLoggedIn, (req, res) => {
   
    console.log(req.body);
    db.collection("coffeeOrders").findOneAndUpdate(
        { _id: ObjectID(req.body.id)
         }, {
          $set: {
            status: true,
            barista: req.user.local.email
          }
        }, {
          sort: { _id: -1 },
          upsert: true
        }, (err, result) => {
          if (err) return res.send(err)
          res.send(result)
        }
      );
  });

  app.delete("/delete", isLoggedIn, (req, res) => {
    db.collection("coffeeOrders").findOneAndDelete(
      { _id: (req.body.id) },
      (err, result) => {
        if (err) return res.send(500, err);
        res.send("Message deleted!");
      }
    );
  });

//   app.delete('/deleteRapper', (request, response) => {
//     db.collection('rappers').deleteOne({stageName: request.body.stageNameS})
//     .then(result => {
//         console.log('Rapper Deleted')
//         response.json('Rapper Deleted')
//     })
//     .catch(error => console.error(error))

// })

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get("/login", function (req, res) {
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });

  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function (req, res) {
    res.render("signup.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get("/unlink/local", isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect("/profile");
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/");
}
