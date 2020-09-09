require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
var LocalStrategy = require('passport-local').Strategy;
// const findOrCreate = require('mongoose-findorcreate');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;


const app = express();
app.set('view engine', 'ejs');

app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const userJournalSchema = new mongoose.Schema({
  username: String,
  blogData: [{
    title: String,
    content: String
  }]
});
userJournalSchema.plugin(passportLocalMongoose);

const UserJournal = mongoose.model("UserJournal", userJournalSchema);

passport.use(new LocalStrategy(UserJournal.authenticate()));

passport.serializeUser(UserJournal.serializeUser());

passport.deserializeUser(UserJournal.deserializeUser());

const homeStartingContent = "This is the Home Page of your Daily Journal. You can see all your record listed below after adding a new content. Click the read more button next to each post for expanding it to a new page. For adding a new post press the compose button on the navigation bar. Your secrets are safe. Happy writing!";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";


app.get("/", function(req, res) {
  if (req.isAuthenticated()) {
    console.log("Logged in");
    res.render("home", {
      startingContent: homeStartingContent,
      posts: req.user.blogData
    });
  } else {
    console.log("Not Logged in");
    res.render("entry")
  }
});
app.post("/", function(req, res) {
  if (req.body.hasOwnProperty("Register")) {
    if (req.body.password1 === req.body.password2) {
      UserJournal.findOne({
        username: req.body.email
      }, function(err, results) {
        if (!err) {
          if (!results) {
            var newUser = new UserJournal({
              username: req.body.email,
              blogData: []
            })
            var registerCB = function(err, user) {
              if (err) {
                console.log(err);
              } else {
                req.login(newUser, function(err) {
                  if (err) {
                    console.log(err);
                  }
                  res.render("home", {
                    startingContent: homeStartingContent,
                    posts: newUser.blogData
                  });
                })
              }
            }
            UserJournal.register(newUser, req.body.password2, registerCB);
          } else if (results) {
            res.render("home", {
              startingContent: homeStartingContent,
              posts: results.blogData
            });
          }
        }
      })
    } else {
      res.send("Sorry! Password and Confirm Password fields doesn't match.Redirecting to Home page in 5 seconds...");
    }
  } else if (req.body.hasOwnProperty("Login")) {
    // var user = new UserJournal ({
    //   username: req.body.loginEmail,
    //   password: req.body.loginPassword
    //
    // })
    //
    // req.login (user, function(err){
    //   if(err){
    //     console.log(err);
    //   }

    passport.authenticate("local", function(err, user, info) {
      if (err) {
        return next(err);
      } else if (!user) {
        return res.redirect('/');
      } else {
        req.login(user, function(err) {
          if (!err) {
            console.log("Authenticated");
            console.log(user);
            res.render("home", {
              startingContent: homeStartingContent,
              posts: user.blogData
            });
          } else {
            console.log(err);
          }
        })
      }
    })(req, res);

  }
});


app.get("/about", function(req, res) {
  res.render("about", {
    aboutContent: aboutContent
  });
});

app.get("/contact", function(req, res) {
  res.render("contact", {
    contactContent: contactContent
  });
});

app.get("/compose", function(req, res) {
  res.render("compose");
});

app.post("/compose", function(req, res) {
  console.log(req.user);

  const newPost = new BlogPost({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  // UserJournal.updateOne({email:})

  //
  // post.save(function(err) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     res.redirect("/");
  //   }
  // });
});

app.get("/posts/:postID", function(req, res) {
  const requestedID = req.params.postID;
  BlogPost.findOne({
    _id: requestedID
  }, function(err, results) {
    if (!err) {
      res.render("post", {
        title: results.title,
        content: results.content
      });
    }
  });
});

app.listen(4000, function() {
  console.log("Server started on port 4000");
});
