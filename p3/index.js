let express = require("express");
let app = express();
let path = require("path");

const { Pool } = require('pg');  // Import the Pool from pg module

const port = process.env.PORT || 5500;

// Set the 'public' directory for static files (e.g., CSS)
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Specify the 'views' folder

// Middleware to parse incoming request bodies
app.use(express.urlencoded({ extended: true }));


const session = require('express-session');

// Use express-session middleware
app.use(session({
  secret: 'yourSecretKey', // Secret key used to sign the session ID cookie (can be any string)
  resave: false,           // Don't force session to be saved back to the store if it wasn't modified
  saveUninitialized: true, // Save uninitialized sessions (sessions that are new but haven't been modified)
  cookie: { secure: false } // For development, use false. For production, use true with HTTPS
}));

// Define the knex configuration to connect to the PostgreSQL database
const knex = require("knex")({
  client: "pg", // PostgreSQL client
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost", // PostgreSQL server's host
    user: process.env.RDS_USERNAME || "postgres", // Your PostgreSQL username
    password: process.env.RDS_PASSWORD || "password", // Your PostgreSQL password
    database: process.env.RDS_DB_NAME || "403ProjectDB", // Your database name
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? {rejectUnauthorized : false} : false 
  },
});

// GET route for the login page
app.get("/", (req, res) => {
  res.render("index"); // Render the index.ejs file
});


// Handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Query the database to check if the username and password match
  knex('usercredentials')
      .where({ username: username, password: password })
      .first()  // Retrieve the first matching record
      .then(user => {
          if (user) {
              // If user is found, store their userId in the session
              req.session.userId = user.user_id;
              res.redirect('/map');  // Redirect to /map page if login is successful
          } else {
              // If no matching user, send an error message
              res.render('index', { error: 'Incorrect username or password' });
          }
      })
      .catch(err => {
          console.error(err);
          res.status(500).send('Server error');
      });
});




// Middleware to check if the user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
      return next();  // User is logged in, proceed to the next middleware
  } else {
      res.redirect('/');  // Redirect to login page if user is not logged in
  }
}



app.get('/map', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId; // Assuming this contains the user's ID
    if (!userId) {
      return res.redirect('/login'); // Redirect if no user is logged in
    }

    // Query the database for the user's first_name
    const user = await knex('usercredentials')
      .select('first_name')
      .where({ user_id: userId }) // Use user_id
      .first();

    if (!user) {
      return res.redirect('/login'); // Redirect if user not found
    }

    // Query the 'country' table to get country data
    const countries = await knex("country").select("*"); // Select all columns from the 'country' table

    // Pass firstName and countries data to the EJS template
    res.render('map', { firstName: user.first_name, countries }); // Pass both to the view
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Server error');
  }
});






// Route to view the account page (protected)
app.get('/viewAccount', isAuthenticated, (req, res) => {
  // Retrieve the user's account details from the database
  knex('usercredentials')
      .where('user_id', req.session.userId)  // Fetch the user by their session userId
      .first()  // Get the first (and only) result
      .then(user => {
          res.render('viewAccount', { user });  // Render the viewAccount page with the user data
      })
      .catch(err => {
          console.error(err);
          res.status(500).send('Error retrieving account information');
      });
});




// Delete account route
// Delete account route
app.post('/deleteAccount', isAuthenticated, (req, res) => {
  const userId = req.session.userId;

  // Delete the user from the database using Knex
  knex('usercredentials')
      .where('user_id', userId)  // Find the user by userId
      .del()  // Delete the record
      .then(() => {
          // Destroy the session after deleting the account
          req.session.destroy((err) => {
              if (err) {
                  console.error(err);
                  return res.status(500).send('Error logging out.');
              }

              // Redirect to login page (index.ejs)
              res.redirect('/');
          });
      })
      .catch((err) => {
          console.error(err);
          return res.status(500).send('Error deleting account.');
      });
});


// POST route for logging out
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          return res.status(500).send('Failed to destroy session');
      }
      // Redirect the user to the login page (index.ejs)
      res.redirect('/');
  });
});


app.get("/createAccount", (req, res) => {
  // Fetch country list from database
  knex.select("country_id", "country_name").from("country")
      .then(countries => {
          res.render("createAccount", { countries });
      })
      .catch(error => {
          console.error(error);
          res.render("createAccount", { countries: [] });
      });
});



// Assuming you're using Express and Knex for database operations

app.post("/createAccount", (req, res) => {
  // Get the form data from the request body
  const firstName = req.body.first_name;
  const lastName = req.body.last_name;
  const userName = req.body.user_name;  // Correct column name is 'username'
  const email = req.body.user_email;    // Correct column name is 'email'
  const password = req.body.user_password;  // Correct column name is 'password'
  const homeAddress = req.body.home_address;
  const homeCity = req.body.home_city;
  const homeState = req.body.home_state;
  const homeCountry = req.body.home_country;
  const homeZip = req.body.home_zip;
  const countryId = req.body.country_id;  // Country ID selected from the dropdown

  // Insert user data into the 'usercredentials' table
  knex('usercredentials')
      .insert({
          first_name: firstName,        // User's first name
          last_name: lastName,          // User's last name
          username: userName,           // Corrected column name to 'username'
          email: email,                 // Corrected column name to 'email'
          password: password,           // Corrected column name to 'password'
          home_address: homeAddress,    // Home address
          home_city: homeCity,          // Home city
          home_state: homeState,        // Home state
          home_country: homeCountry,    // Home country (this might be redundant with country_id)
          home_zip: homeZip,            // Home zip code
          country_id: countryId        // Country ID (this is the value passed from the dropdown)
      })
      .then(() => {
          // If the insert is successful, redirect to a confirmation page or another view
          res.redirect('/'); // Redirect to an account creation success page
      })
      .catch((err) => {
          // If there's an error during insertion, log the error and respond with an error message
          console.error(err);
          res.status(500).send('Error creating account. Please try again later.');
      });
});


app.get('/editAccount', (req, res) => {
  // Assuming you're using session to track the logged-in user
  const userId = req.session.userId; // Replace with actual session variable
  
  // Use Knex to get user data
  knex('usercredentials')
    .select('first_name', 'last_name', 'home_address', 'home_city', 'home_state', 'home_country', 'home_zip', 'username', 'email')
    .where('user_id', userId)  // Ensure you're selecting the correct user based on session
    .first()  // Assuming there's only one user with the given user_id
    .then(user => {
      if (!user) {
        return res.status(404).send('User not found');
      }
      
      // Pass user data to EJS template
      res.render('editAccount', { user });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error fetching user data');
    });
});


app.post('/editAccount', (req, res) => {
  const userId = req.session.userId; // Replace with actual session variable
  const { first_name, last_name, home_address, home_city, home_state, home_country, home_zip, username, email, password } = req.body;
  
  // Update user data using Knex
  knex('usercredentials')
    .where('user_id', userId)  // Find the user by user_id
    .update({
      first_name,
      last_name,
      home_address,
      home_city,
      home_state,
      home_country,
      home_zip,
      username,
      email,
      password
    })
    .then(() => {
      // Redirect the user after the update
      res.redirect('/viewAccount');
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error updating account');
    });
});


app.get('/resources', (req, res) => {
  // You can process any incoming data from the request body here, if needed
  res.render('resources');
});





// GET route for the Uganda page
app.get("/uganda", (req, res) => {
  res.render("uganda"); // Render the uganda.ejs file
});

// GET route for Dominican Republic
app.get('/dominicanRepublic', (req, res) => {
  res.render('dominicanRepublic', { title: 'Dominican Republic Information' });
});

// GET route for Mongolia
app.get('/mongolia', (req, res) => {
  res.render('mongolia', { title: 'Mongolia Information' });
});

// Start the Express app on the specified port
app.listen(port, () =>
  console.log(`Express App has started and server is listening on port ${port}!`)
);
