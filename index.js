import express, { query } from "express";
import bodyParser from "body-parser";
import pg from "pg";
// import User from './models/user'; // Replace with your user model

// set password
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy  } from 'passport-local';

// set api for img
import multer from "multer";
import path from "path";
import fs from "fs";

import session from "express-session";
import env from "dotenv";



const app = express();
const port = 3000;
const saltRounds = 10;

env.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json()); 

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*60*60*24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.database_user,
  host: process.env.database_host,
  database: process.env.database_name,
  password: process.env.database_password,
  port: process.env.database_port,
});
db.connect();

// Set up storage engine for multer
const storage = multer.diskStorage({
    destination: './public/imgs/', // folder where images will be stored
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Filename format
    }
  });
  
  // Initialize multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // limit file size to 5MB
  }).single('image');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next(); // User is authenticated, allow access
    }
    res.redirect('/login'); // User is not authenticated, redirect to login
  }

function addDaysToDate(startDate, daysToAdd) {
    const resultDate = new Date(startDate); 
    resultDate.setDate(resultDate.getDate() + daysToAdd); 
    return resultDate; 
}


let status = false;

app.get("/", async(req,res) =>{
    try {
        //get most popular books
        const sqlPop = "SELECT COUNT(book_name), book_name FROM  in_out_books  GROUP BY book_name ORDER BY COUNT(book_name) DESC LIMIT 3;";
        const response = (await db.query(sqlPop)).rows;

        let pop_books = [];
        let p = 0;
        for(let i = 0; i < response.length; i++){
            let name =  response[i].book_name;
            const sqlPopSingle = "SELECT * FROM books WHERE title = $1";
            const singleResponse = await db.query(sqlPopSingle, [name]);
            pop_books[p] = singleResponse.rows[0];
            p++;
        }

        // all books group by name
        const sql =  "SELECT title, isbn, STRING_AGG(DISTINCT author_name, ', ') AS author_names, MIN(img_url) AS img_url FROM  books GROUP BY title, isbn ORDER BY title;";
        const books = (await db.query(sql)).rows; 
    
        const perPage = 16; // 4 rows * 4 columns = 16 books per page
        const page = parseInt(req.query.page) || 1;
    
        const totalBooks = books.length;
        const paginatedBooks = books.slice((page - 1) * perPage, page * perPage);
    
        res.render("index.ejs", {
          populars: pop_books,
          books: paginatedBooks,
          currentPage: page,
          totalPages: Math.ceil(totalBooks / perPage),
        });
      } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).send("Internal Server Error");
      }
});

app.get("/home", (req,res)=>{
    res.redirect("/");
});



app.get("/login", (req,res) =>{
    res.render("login.ejs");
});



app.get("/register", (req,res) =>{
    res.render("register.ejs");
});

app.get("/search", (req,res)=>{
    res.redirect("/");
});


// need Auth
app.get("/userPage", (req,res)=>{
    if(req.isAuthenticated() && req.user.type === 'user'){
        res.render("./user_side/userPage.ejs",{
            username: req.user.username,
            userEmail: req.user.email
        });
    }else{
        res.redirect("/login");
    }
});


app.get("/request", ensureAuthenticated, async(req,res)=>{
    if(req.isAuthenticated() && req.user.type === 'manager'){
        try{
            const sql = "SELECT * FROM requests";
            const results =  (await db.query(sql)).rows;
    
            res.render("./manager_side/request.ejs", {
                requests: results
            })   
        }catch(err){
            console.log(err);
        }
    }else{
        res.redirect("/login");
    }

});


app.get("/editProfile", ensureAuthenticated, async(req, res)=>{
    res.render("./user_side/editUser.ejs");
});


app.post("/return", ensureAuthenticated, async(req,res)=>{
    console.log(req.body);
    const request = req.body;
     // check if inputs is empty or has '' 
     const containsSpace = (input) => !input.trim() || /\s/.test(input);

    if(req.isAuthenticated() && req.user.type === 'user'){
        if (!containsSpace(request.day)) {
            try{
                const sql = "INSERT INTO requests (book_id, user_id, title, req_date, borrow_or_return, borrow_days, status, order_id) VALUES ($1, $2, $3, $4, $5, 0, FALSE, $6)";
                await db.query(sql, [request.bookID, request.userID, request.title, request.day, 'return', request.orderID]);
                res.redirect("/orders");
            }catch(err){
                res.send(err);
            }
        }else{
            res.send("the input cannot be empty!");
        }

    }else{
        res.redirect("/login");
    }

});





// need auth
app.get("/manage", (req,res)=>{
    if(req.isAuthenticated() && req.user.type === 'manager'){
        res.render("./manager_side/manage.ejs",{
            username: req.user.username,
            userEmail: req.user.email

        }
        );
    }else{
        res.redirect("/login");
    }
});

app.get("/account", ensureAuthenticated,  (req, res) => {
    if (req.isAuthenticated()) {
        const userType = req.user.type;  // Assuming `req.user` contains the logged-in user and their type
        if (userType === "manager") {
            return res.redirect("/manage");
        } else {
            return res.redirect("/userPage");
        }   
    }else{
        res.redirect("/login");
    }

    
});



app.get("/allBooks", async (req,res)=>{
    if(req.isAuthenticated() && req.user.type === 'manager'){
        const sql = "SELECT id, title, author_name, isbn FROM books;";
        const result = (await db.query(sql)).rows;
        res.render("./manager_side/allBooks.ejs", {
        books:result
        });
    }else{
        res.send("Only the manager can access this page! Please login!")
    }
    
});


// remeber to set the available in the book as true
app.get("/add", (req,res)=>{
    res.render("./manager_side/add.ejs")
})



app.get("/orders", ensureAuthenticated, async(req, res)=>{
    const userID = req.user.id;
    const sql = "SELECT * FROM requests WHERE user_id = $1";
    if(req.isAuthenticated()){
        const response = await db.query(sql, [userID]);
        console.log(response.rows);
        res.render("./user_side/orders.ejs", {
            requests: response.rows,
        })
    }else{
        res.redirect("/login");
    }
})


app.post("/cancelOrder", ensureAuthenticated, async(req, res)=>{
    const orderID = req.body.requestID;
    const sql = "DELETE FROM requests WHERE req_id = $1;"
   
    if(req.isAuthenticated()){
        const response = await db.query(sql, [orderID]);
        res.redirect("/orders");
    }else{
        res.redirect("/orders");
    }
})

app.get("/orderHistory", ensureAuthenticated, async(req, res) =>{
    const sql = "SELECT * FROM in_out_books WHERE user_id = $1 ORDER BY order_id DESC;";

    if(req.isAuthenticated()){
        const response = await db.query(sql, [req.user.id]);
        const userOrders = response.rows;
        
        res.render("./user_side/orderHistory.ejs", {
            orders: userOrders, 
            
        });
    }else{
        res.redirect("/login");
    }
    
})

app.get("/forgot", (req, res) =>{
    res.render("forgot.ejs", {
        status: false
    });
});

app.post("/checkEmail", async(req, res)=>{
    const sql = "SELECT * FROM users WHERE email = $1";
    console.log(req.body.email);
    const response = await db.query(sql, [req.body.email]);
    if(response.rows.length < 1){
        res.render("forgot.ejs", {
            msgForgot: "This email was not registered!",
            status: false
        });
    }else{
        const questionS = response.rows[0].security_q;
        res.render("forgot.ejs",{
            email: req.body.email,
            question: questionS,
            status: false
        })
    }
})

app.post("/checkAnswer", async(req, res)=>{
    const answer = req.body.answer;
    const sql = "SELECT * FROM users WHERE email = $1";
    const response = await db.query(sql, [req.body.email]);
    // console.log(response);
    const storeAnswer = response.rows[0].security_a;
    try {
        bcrypt.compare(answer, storeAnswer, (err, isMatch) => {
            if (err) {
            return err;
            }
            if (isMatch) {
                return res.render("forgot.ejs", {
                    status: true,
                    email: req.body.email,
                });
            } else {
                return res.render("forgot.ejs", {
                    status: false,
                    email: req.body.email,
                    question: req.body.question,
                });
            }
        });
    }catch(err){
        console.error("Error in /checkAnswer:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/updatePass", async(req, res)=>{
    const newPass = req.body.password;
    const email = req.body.email;
    const containsSpace = (input) => !input.trim() || /\s/.test(input);

    if (containsSpace(newPass)) {
        res.render("forgot.ejs", {
            msgForgot: "the password cannot be empty!",
            status: true
        });
    }
    try{
        const hashPassword = await bcrypt.hash(newPass, saltRounds);
        const sql = "UPDATE users SET password  = $1 WHERE email = $2";
        await db.query(sql, [newPass, email]);
        res.redirect("/login");
    }catch(err){
        res.send(err);
    }
    



})

app.post("/updateUsername", ensureAuthenticated, async(req, res) =>{
    const user_id = req.user.id;
    const updateName = req.body.name;

    const containsSpace = (input) => !input.trim() || /\s/.test(input);

    if (containsSpace(updateName)) {
        res.redirect("/editProfile");
    }
    

    const sql = "UPDATE users SET username  = $1 WHERE id = $2";
    if(req.isAuthenticated()){
        const response = await db.query(sql, [updateName, user_id]);
        res.render("./user_side/editUser.ejs", {
            msgUpdate: "Successful updated!"
        });
    }else{
        res.redirect("login");
    }

});

app.post("/updatePassword", ensureAuthenticated, async(req, res) =>{
    const user_id = req.user.id;
    const updatePassword = req.body.password;

    const containsSpace = (input) => !input.trim() || /\s/.test(input);

    if (containsSpace(updatePassword)) {
        res.redirect("/editProfile");
    }

    const hashPassword = await bcrypt.hash(updatePassword, saltRounds);
    const sql = "UPDATE users SET password  = $1 WHERE id = $2";
    if(req.isAuthenticated()){
        const response = await db.query(sql, [hashPassword, user_id]);
        res.render("./user_side/editUser.ejs", {
            msgUpdate: "Successful updated!"
        });
    }else{
        res.redirect("login");
    }

});



app.post("/confirm_req", ensureAuthenticated, async(req, res)=>{
    let days = parseInt(req.body.days, 10);

    const manageID = req.user.id;
    const currDate = new Date(req.body.date);
    const returnDate = addDaysToDate(currDate, days);


    if(req.isAuthenticated() && req.user.type === 'manager'){
        if(req.body.BorrowOrReturn === 'borrow'){
            const sql = "INSERT INTO in_out_books (user_id, book_id, book_name, manager_id, borrow, borrow_time, returned, return_time ) VALUES  ($1, $2, $3, $4, $5, $6, false, $7)";
            const response = await db.query(sql, [
                req.body.UserID, 
                req.body.bookID, 
                req.body.title, 
                manageID, 
                true, 
                currDate, 
                returnDate
            ]);

            const updateReq = "UPDATE requests SET status  = true WHERE req_id = $1";
            await db.query(updateReq, [req.body.requestID]);

            const updateAll = "UPDATE books SET available  = false WHERE id = $1";
            await db.query(updateAll, [req.body.bookID]);

            res.redirect("/request");
        }else if(req.body.BorrowOrReturn === 'return'){
            const orderIDRep = "SELECT order_id FROM requests WHERE req_id = $1";
            const responseOrder = await db.query(orderIDRep, [req.body.requestID]);
            const orderID = responseOrder.rows[0].order_id;
            
            const returnSQL = "UPDATE in_out_books SET returned = true, return_time = $1 WHERE order_id = $2";
            await db.query(returnSQL, [req.body.date, orderID]);

            const updateReq = "UPDATE requests SET status  = true WHERE req_id = $1";
            await db.query(updateReq, [req.body.requestID]);

            const updateAll = "UPDATE books SET available  = true WHERE id = $1";
            await db.query(updateAll, [req.body.bookID]);

            res.redirect("/request");
        }
    }else{
        res.redirect("/login");
    }
    
});


app.post("/search", async(req,res) =>{
    
    const searchBook = req.body.search.toLowerCase().replace(/\s+/g, '');
    console.log(searchBook);
    const sql = "SELECT * FROM books WHERE LOWER(REPLACE(title, ' ', '')) LIKE '%' || $1 || '%' OR LOWER(REPLACE(author_name, ' ', '')) LIKE '%' || $1 || '%' OR isbn LIKE '%' || $1 || '%'";
    const response = await db.query(sql, [searchBook]);
    console.log(response);

    if(response.rows.length === 0){
        res.render("index.ejs", {
            msgSearch : "Sorry, No items found!",
        })
    }else{
        const books = response.rows;
        const perPage = 16; // 4 rows * 4 columns = 16 books per page
        const page = parseInt(req.query.page) || 1;
        const totalBooks = books.length;
        const paginatedBooks = books.slice((page - 1) * perPage, page * perPage);
    
        res.render("index.ejs", {
          books: paginatedBooks,
          currentPage: page,
          totalPages: Math.ceil(totalBooks / perPage),
        });
    }
})


// register and login need to check user's type 
app.post("/register", async(req, res)=>{

    const username = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const securityQ = req.body.question;
    const answer = req.body.securityAnswer;


    // check if inputs is empty or has '' 
    const containsSpace = (input) => !input.trim() || /\s/.test(input);

    if (containsSpace(username) || containsSpace(email) || containsSpace(password) ||  containsSpace(answer)) {
        
        res.render("register.ejs", {
            msgRegister: "Input fields must not be empty or contain spaces.",
        });
        return res.status(400);
    }
    
    const sql = "SELECT * FROM users WHERE email = $1";
    try {
        const checkResult = await db.query(sql, [email]);
        if (checkResult.rows.length <= 0) {
            try{
                // Hash password
                const hash = await bcrypt.hash(password, saltRounds);
                const hashAnswer = await bcrypt.hash(answer, saltRounds);
                
                // Insert the new user
                const sql_insert = "INSERT INTO users (username, email, password, security_q, security_a) VALUES ($1, $2, $3, $4, $5)";
                const response = await db.query(sql_insert, [username, email, hash, securityQ, hashAnswer]);
                
                res.redirect("/login");
            }catch(err){
                console.error("Error during user registration:", err);
                res.render("register.ejs", {
                    msgRegister: err
                });
            }
            
            
    }} catch(err) {
        console.error("Error during user registration:", err);
        // Handle the error appropriately, maybe send a response to the client
        res.status(500).send("Internal server error");
    }


});

app.post("/login", (req,res,next)=>{
    passport.authenticate("local", (err, user, info)=>{
        if(err){
            return nextTick(err);
        }

        if (!user) {
            return res.status(400).send(info.message); // Handle incorrect login
        }

        req.logIn(user,(err)=>{
            if(err){
                return next(err);
            }
            if(user.type === 'user'){
                res.redirect("/");
            }
            else if (user.type === 'manager'){
                res.redirect("/");
            }
        });
    })(req, res, next);
});

app.post("/logout", (req, res, next)=>{
    req.logout((err) =>{
        if(err){
            return next(err);
        }
        // if no error, we can destory the current session
        req.session.destroy(()=>{
            res.redirect('/login');
        });
        
    });
});




app.post("/delete-book", ensureAuthenticated, async (req, res)=>{
    if(req.isAuthenticated() && req.user.type === 'manager'){
        const id_delete = req.body.bookID;
        const isbn_delete = req.body.bookISBN;
        const sql = "DELETE FROM books WHERE id = ($1) AND isbn = ($2);"
        await db.query(sql, [id_delete, isbn_delete])
        res.redirect("/allBooks");
    }else{
        res.redirect("/login");
    }
   
});



// need auth
app.post("/in_out", ensureAuthenticated, async(req,res) =>{
    console.log(req.body);
    const response = await db.query("SELECT * FROM books WHERE isbn = $1 AND available = true", [req.body.isbn]);
    const totalNum = response.rows.length;
    if(totalNum === 0){
        res.render("index.ejs", {
            msgSearch: "Sorry, this book currently is unavailable."
        })
    }else{
        const reqTotl = await db.query("SELECT COUNT(*) AS numbers FROM requests WHERE title = $1 AND borrow_or_return = $2 AND status = False", [req.body.title, 'borrow']);
        const reqNum = reqTotl.rows[0].numbers;
        const  bookID = response.rows[0].id;


        if(req.isAuthenticated()){
            const book_object = req.body;
            res.render("in_out.ejs", {
                currNum: totalNum - reqNum,
                img: book_object.bookImg,
                bookid: bookID,
                bookIsbn: book_object.isbn,
                bookTitle:  book_object.title,
                bookAuthor: book_object.author,
                userID: req.user.id

            });
        }else{
            res.redirect("/login");
        }
    }
    
   
});

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).send('Error: File upload failed.');
      }
      try{
        const fullPath = req.file.path;
        const relativePath = fullPath.replace('public/', '');
        console.log(relativePath);
        
        res.render("./manager_side/add.ejs", {
            imgLink: relativePath,
        });
      }catch(err){
        res.send(err);
      }
      
    });
  });
  

app.post("/add_book", ensureAuthenticated, async(req, res)=>{
    console.log(req.body);
    const title = req.body.bookName;
    const author = req.body.authorName;
    const imgURL = req.body.imgURL;
    const isbn = req.body.isbn;

    const sql = "INSERT INTO books (title, author_name, img_url, isbn, available) VALUES ($1, $2, $3, $4, true)";
    if(req.isAuthenticated() && req.user.type === 'manager'){
        try{
            await db.query(sql, [title, author, imgURL, isbn]);
            res.render("./manager_side/add.ejs", {
                msgUpload: "Successed add the book!"
            });
        }catch(err){
            res.send(err);
        }

    }

})

app.post("/borrow", ensureAuthenticated, async(req, res) =>{
    
    const request = req.body;
     // check if inputs is empty or has '' 
     const containsSpace = (input) => !input.trim() || /\s/.test(input);

     
    if(req.isAuthenticated() && req.user.type === 'user'){
        if (!containsSpace(request.day)) {
            try{
                const sql = "INSERT INTO requests (book_id, user_id, title, req_date, borrow_or_return, borrow_days, status) VALUES ($1, $2, $3, $4, $5, $6, FALSE)";
                await db.query(sql, [request.bookID, request.userID, request.title, request.day, 'borrow', request.days]);
                res.redirect("/orders");
            }catch(err){
                res.send(err);
            }
        }else{
            res.send("the input cannot be empty!");
        }

    }else{
        res.redirect("/login");
    }
})

passport.use(new Strategy(
    {
        usernameField: 'email', // We're using email as the username
        passReqToCallback: true // Allows us to pass the `req` object to the callback
      },
      async (req, email, password, cb) => {
        const userType = req.body.userType;
        let sql;
    
        // define the user type
        if (userType === 'user') {
          sql = "SELECT * FROM users WHERE email = $1";
        } else if (userType === 'manager') {
          sql = "SELECT * FROM managers WHERE email = $1";
        } else {
            return cb(null, false, { message: 'Invalid user type!' });
        }
    
        try {
          const result = (await db.query(sql, [email])).rows;
          if (result.length === 0) {
            return cb(null, false, { message: 'The user does not exist!' });
          }
    
          const user = result[0];
          const storedPassword = user.password;
    
          // Compare the hashed password with the one provided
          bcrypt.compare(password, storedPassword, (err, isMatch) => {
            if (err) {
              return cb(err);
            }
            if (isMatch) {
                // ensure that we transfer type with cookie
                user.type = userType;    
                console.log(user);
                return cb(null, user); // Authentication successful
            } else {
                return cb(null, false, { message: 'Incorrect password!' });
            }
          });
        } catch (err) {
          return cb(err);
        }
      }
    ));


    passport.serializeUser((user, cb)=>{
        cb(null, { id: user.id, type: user.type });
    });

    passport.deserializeUser((obj, cb)=>{
        let sql;

        if (obj.type === 'user') {
            sql = "SELECT id, username, email FROM users WHERE id = $1";
        } else if (obj.type === 'manager') {
            sql = "SELECT id, username, email FROM managers WHERE id = $1";
        }

        db.query(sql, [obj.id]).then(result => {
            const user = result.rows[0];
            user.type = obj.type;  // Ensure type is added back to the user object
            cb(null, user);
          })
          .catch(err => cb(err));

    });





app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
