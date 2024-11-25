let express = require("express");
let app = express();
let path = require("path");

const port = 5500;

// making the application know about the public file that contains the css styling file
app.use(express.static(path.join(__dirname, "public")));


// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Specify the 'views' folder

// Middleware to parse incoming request bodies
app.use(express.urlencoded({ extended: true }));

// Define the knex configuration to connect to the PostgreSQL database
const knex = require('knex')({
  client: 'pg', // PostgreSQL client
  connection: {
    host: 'localhost', // PostgreSQL server's host
    user: 'postgres', // Your PostgreSQL username
    password: 'password', // Your PostgreSQL password
    database: 'Project403' // Your database name
  }
});

// Main route to render data from the database
app.get("/", (req, res) => {
  knex.select('*')  // Select all data
    .from('countries')  // From the 'countries' table
    .orderBy('country')  // Order by the 'country' column (make sure this column exists)
    .then(countries => {
      res.render("index", { countries: countries });  // Pass the 'countries' data to the 'index' view
    })
    .catch(err => {
      console.log(err);  // Log the error if something goes wrong
      res.status(500).json({ err });  // Send a 500 response in case of an error
    });
});


//route to the uganda page. 
app.get("/uganda", (req, res) => {
    res.render("uganda");
})


// Start the Express app on the specified port
app.listen(port, () => console.log(`Express App has started and server is listening on port ${port}!`));
