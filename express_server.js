//-------------------- Port --------------------//

const PORT = 8080; // default port 8080

//-------------------- Dependencies --------------------//

const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
app.use(cookieParser())
app.set("view engine", "ejs");

// -------------------- Data --------------------//

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  aJasfE: {
    id: "uaJasfE",
    email: "user2@example.com",
    password: "dishwasher-funk",
  }};

function generateRandomString() {
  const chars ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let string = '';
  for (let i = 0; i < 6; i++){
    string += chars.charAt(Math.floor(Math.random() * chars.length));
  };
  return string;
}

function urlsForUser(id) {
  urls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}

//-------------------- GET Routes --------------------//

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route for rendering main page
app.get("/urls", (req, res) => {
  const userUrls = urlsForUser(req.cookies['user_id']);
  console.log(req.cookies['user_id']);
  const templateVars = { 
    urls: userUrls,
    user: users[req.cookies['user_id']],
  };
  res.render("urls_index", templateVars);
});

// Route for rendering page to add new URLs
app.get("/urls/new", (req, res) => {
  if(!req.cookies['user_id']) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[req.cookies['user_id']]
    };
    res.render("urls_new", templateVars);
  }
});

// Route for rendering specific URL pages which allow editing long URL
app.get("/urls/:id", (req, res) => {
  if(!urlDatabase[req.params.id]) {
    res.status(404).send('This short URL does not exist.');
  } else if(!req.cookies['user_id']) {
    res.status(403).send('Users must login to see URL page.');
  } else if (req.cookies['user_id'] !== urlDatabase[req.params.id].userID){
    res.status(401).send('This URL does not belong to this account.');
  } else {
    const templateVars = {
      user: users[req.cookies['user_id']],
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL
    };
    res.render("urls_show", templateVars);
  }
});

// Route for redirecting to specific URL page from short URL link
app.get("/u/:id", (req, res) => {
  if(!urlDatabase[req.params.id]) {
    res.status(404).send('This short URL does not exist.');
  } else {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
});

// Route for rendering user registrtion page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  };
  if(req.cookies['user_id']) {
    res.redirect("/urls");
  } else {
    res.render("user_registration", templateVars);
  }
});

// Route for rendering user login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  };
  if(req.cookies['user_id']) {
    res.redirect("/urls");
  } else {
    res.render("user_login", templateVars);
  }
});

//-------------------- POST Routes --------------------//
// Post request to handle user registration
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send('Do not leave the email or password field empty.');
  };
  for (const user in users) {
    if(users[user].email === req.body.email) {
      return res.status(400).send('An account already exist with this email.');
    }
  };
  const user_id = generateRandomString();
  users[user_id] = {
    id: user_id,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', user_id);
  res.redirect("/urls");
});

// Post request to handle user login
app.post("/login", (req, res) => {
  for (const user in users) {
    if(users[user].email === req.body.email) {
      if(users[user].password === req.body.password) {
        res.cookie('user_id', users[user].id);
        return res.redirect("/urls");
      } else {
        return res.status(400).send('The password entered is incorrect.');
      }
    };
  };
  return res.status(400).send('This account does not exist.');
});

// Post request to handle user logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

// Post request to handle URL shortening
app.post("/urls", (req, res) => {
  if(!req.cookies['user_id']) {
    res.send('Users must login to shorten URL.');
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.cookies['user_id']
    };
    res.redirect("/urls/"+shortURL);
  }
});

// Post request to handle URL editing
app.post("/urls/:id", (req, res) => {
  if(!urlDatabase[req.params.id]) {
    res.status(404).send('This short URL does not exist.');
  } else if(!req.cookies['user_id']) {
    res.status(403).send('Users must login to edit URL.');
  } else if (req.cookies['user_id'] !== urlDatabase[req.params.id].userID){
    res.status(401).send('This URL does not belong to this account.');
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

// Post request to handle URL deletion
app.post("/urls/:id/delete", (req, res) => {
  if(!urlDatabase[req.params.id]) {
    res.status(404).send('This short URL does not exist.');
  } else if(!req.cookies['user_id']) {
    res.status(403).send('Users must login to edit URL.');
  } else if (req.cookies['user_id'] !== urlDatabase[req.params.id].userID){
    res.status(401).send('This URL does not belong to this account.');
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});