//######################################
//William Patruno C04222, 25/02/2022 
//Prenotazione aule a capienza limitata
//######################################


//caricamento delle variabili di ambiente durante la sviluppo
if(process.env.NODE_ENV !== "production"){                  
    require("dotenv").config()
}

const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const passport = require("passport")
const LocalStrategy = require("passport-local")
const User = require("./models/user")
const Event = require("./models/event")

//Connessione al DB
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true })
const db = mongoose.connection
db.on("error", error => console.error(error))
db.once("open", () => console.log("connesso a mongoose"))

app.set("view engine", "ejs")
app.set("views", __dirname + "/views")
app.set("layout", "layouts/layout")
app.use(expressLayouts)
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(require("express-session")({
  secret: "secretWord",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ##########################
// AUTHENTICATION ROUTES

app.get("/", function(req, res){
  res.redirect("/login"); 
});

app.get("/profile", isLoggedIn, async function(req, res){
    const events = await Event.find()
    res.render("auth/profile", {
     currentUser: req.user,
     events: events
   });
});

app.get("/register", function(req, res){
   res.render("auth/register");
});

app.post("/register", function(req, res){
   User.register(new User({username: req.body.username, id: Date.now().toString()}), req.body.password, function(err, user){
       if(err){
           console.log(err);
           return res.render("auth/register", {
             errorMessage: "Email già registrata"
           });
       }
       passport.authenticate("local")(req, res, function(){
           res.redirect("/profile");
       });
   });
});

app.get("/login", function(req, res){
  checkOld()
  res.render("auth/login");
});

app.post("/login", passport.authenticate("local",{
   successRedirect: "/profile",
   failureRedirect: "/login"
}), function(req, res){});

app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});

function isLoggedIn(req, res, next){
   if(req.isAuthenticated()){
       return next();
   }
   res.redirect("/login");
}

//###########################
// EVENTS ROUTES

app.get("/events", isLoggedIn, async (req, res) => {
  try {
      var events = await Event.find()
      res.render("events/index", {
        events: events,
        currentUser: req.user
      })
    } catch {
      res.redirect("/events")
    }
})

app.get("/events/new", isLoggedIn, async (req, res) => {
  res.render("events/new")
})

app.post("/events", async (req, res) => {
  var event = new Event({
      id: Date.now().toString(),
      materia: req.body.materia,
      aula: req.body.aula,
      capienza: req.body.capienza,
      date: new Date(req.body.date),
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      docente: req.body.docente,
      contacts: req.body.contacts
  })
  try {
      var newEvent = await event.save()
      res.redirect("/events")
  } catch {
      res.render("events/new", {
          errorMessage: "Errore durante la creazione"
      })
  }
})

//eliminazione di eventi passati
async function checkOld(){
  var events = await Event.find()
  var now = new Date()
  now = now.getTime()
  for (const element of events) {
    if (element.date.getTime() <= now) {
      await Event.deleteOne({id: element.id})
      console.log("evento passato eliminato")
    }
  };
}

//###################################
// AJAX ROUTES

//prenotazione proveniente da /events
app.post("/prenota", isLoggedIn, async (req, res) => {
  console.log("test 1")
  var eventId = req.body.eventSelected
  var event = await Event.findOne({id: eventId}).exec()
  var loggedUser = req.user
  
  if(loggedUser.iscrizioni.includes(eventId)){
    res.type("text/plain")
    res.write("Risulti già iscritto a questo evento")
    res.end()

  }else{
    if (event.iscritti < event.capienza){
      event.iscritti = event.iscritti + 1
      event.studentiIscritti.push(loggedUser.username)
      await event.save()
      loggedUser.iscrizioni.push(eventId)
      await loggedUser.save()
      res.type("text/plain");
      res.write("Iscrizione aggiunta")
      res.end();

    } else {
      res.type("text/plain")
      res.write("Numero di iscrizioni massime raggiunto")
      res.end()
    }}
})

//eliminazione proveniente da /profile
app.post("/elimina", isLoggedIn, async (req, res) => {

  var eventId = req.body.eventSelected
  var event = await Event.findOne({id: eventId}).exec()
  var loggedUser = req.user
  var eventIndex = loggedUser.iscrizioni.indexOf(eventId)
  var studentIndex = event.studentiIscritti.indexOf(loggedUser.username)

  loggedUser.iscrizioni.splice(eventIndex, 1)
  event.iscritti = event.iscritti - 1
  event.studentiIscritti.splice(studentIndex, 1)
  await event.save()
  await loggedUser.save()
  res.end();
})


//Listening del server
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("Il server è accessibile qui: http://127.0.0.1:"+ PORT);
});
