const express = require('express');
const app = express();
require('dotenv').config();
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const User = require('./models/User');

const fetch = (url) =>
    import("node-fetch").then(({ default: fetch }) => fetch(url));


// cookies
const cookieParser = require('cookie-parser');
app.use(cookieParser());



// set the view engine to ejs
app.set("views", __dirname + "/views"); //#
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(express.json());


// To parse form submitted url-encoded data, middleware is used and parsed data is available in the req.body
app.use(express.urlencoded()); 


app.use(authRoutes);
app.use('/images', express.static('images'));

//apply this middleware to every single route   
app.get('*', checkUser);
app.post('*', checkUser);




// function to convert sec string to readable form
function secondsToString(seconds) {
    var numyears = Math.floor(seconds / 31536000);
    var numdays = Math.floor((seconds % 31536000) / 86400);
    var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;

    if (numdays != 0)
        return numdays + "days " + numhours + "hr " + numminutes + "mins";
    else
        return numhours + "hr " + numminutes + "mins";

}

const port = process.env.PORT || 8080;

//connection with database
const dbURI = process.env.URI;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(port))
    .catch((err) => console.log(err));




// val is passed to views for underlining view name

// home page
app.get('/home', function (req, res) {
   
    // use res.render to load up an ejs view file

    let url = process.env.URL2;
    //fetching the contest data
    fetch(url)
        .then((response) => {
             if(!response.ok){
                throw new Error('Failed to fetch data');
             }
             return response.json();               //extract the JSON data
        })
        .then((data) => res.render('pages/index', { contests: data, getTime: secondsToString, val: 1 }))
        .catch((err)=>{
            console.log(err.messagse);
            res.redirect('/home');
        })
});

app.get('/', (req, res) => {
    res.redirect('/home');
});

var platforms={
    CodeForces: 'codeforces.com',
    CodeChef:'codechef.com',
    AtCoder: 'atcoder.jp',
    HackerEarth:'hackerearth.com',
    HackerRank : 'hackerrank.com',
    LeetCode: 'leetcode.com'
 };

// Handle post request on applying filter
app.post('/', function (req, res) {

    let url = process.env.URL1;   // base url
    let filtered_json = req.body
    console.log(filtered_json);
      
 // Generating url for filtered data   
    let source = ''; 
    

    // console.log('filtered_json : ',filtered_json); 
    let anyTaken = 0;
    for(platform in filtered_json){
            if(anyTaken){
                source=source+','+platforms[platform];
            }
            else{
                anyTaken=1;
                source+=platforms[platform];
           }
       
    }

   // add the filters to the url
    url+= source;
    console.log('src', source);

    
  // fetch requested data    
    fetch(url)
        .then((response) =>{
            if(!response.ok){
                throw new Error('Failed to fetch data');
             }
             return response.json();  
        })
        .then((data) => {

            if (Object.keys(data).length === 0) {
                // Handle empty response
                res.redirect('/home');
            } else {
            res.render('pages/index', { contests: data, getTime: secondsToString, val: 0 })
            }
        })
        .catch((err)=>{
            console.log(err.messagse);
            res.redirect('/home');
        })

});





//............. reminder pages only for autorized user...............


// To store ids of the contets that are marked for reminding
var reminded_contest_ids = {}; 


app.get('/reminder', requireAuth, async (req, res) => {

    let user = res.locals.user;    // a way to pass data from middleware to view templates.

    // get the user email who is logged in 
    let email = user.email;

    // check if the user is already set reminder for some contests in reminder collection
    const user_reminder = await User.Reminder.findOne({ email });

    // get thodes ids from DB and mark true before rendering
    if (user_reminder) {
        for(ids in user_reminder.recorded_ids){
           reminded_contest_ids[ids] = true; 
        }
    }

    // this url allows to show specific contest reminders (famous platforms)
    let url = process.env.URL2;

     fetch(url)
    .then((response) => {
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        return response.json();
    })
    .then((data) => {
        if (Object.keys(data).length === 0) {
            // Handle empty response
            res.redirect('/reminder');
        } else {
            // Process the data and render the page
            res.render('pages/reminder', { contests: data, getTime: secondsToString, val: 1, records: reminded_contest_ids });
        }
    })
    .catch((err) => {
        console.log('ERROR IN loading reminder: ', err);
        res.redirect('/reminder');
    });


})

// Set up a reminder using contest id
app.post('/reminder', async function (req, res) {
    let user = res.locals.user;
    let email = user.email;
    const user_reminder = await User.Reminder.findOne({ email });

 // get thodes ids from DB and mark true before rendering
 if (user_reminder) {
    for(ids in user_reminder.recorded_ids){
       reminded_contest_ids[ids] = true; 
    }
}

    let url = process.env.URL1;
    let filtered_json = req.body
   

    let source = '';
    let anyTaken = 0;
    for(platform in filtered_json){
            if(anyTaken){
                source=source+','+platforms[platform];
            }
            else{
                anyTaken=1;
                source+=platforms[platform];
           }
       
    }

   // add the filters to the url
    url+= source;


    fetch(url)
    .then((response) => {
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        return response.json();
    })
    .then((data) => {
        if (Object.keys(data).length === 0) {
            // Handle empty response
            res.redirect('/reminder');
        } else {
            // Process the data and render the page
            res.render('pages/reminder', { contests: data, getTime: secondsToString, val: 1, records: reminded_contest_ids });
        }
    })
    .catch((err) => {
        console.log('ERROR IN loading reminder: ', err);
        res.redirect('/reminder');
    });


});




// ................. EMAIL REMINDER scheduling using nodemailer .........................

let cron = require('node-cron');
let nodemailer = require('nodemailer');
const schedule = require('node-schedule');


// set a remider when clicked using contest id
app.get('/setrem/:id', async (req, res) => {


    var cont_id = req.params.id;
    if (cont_id == undefined) {
        res.redirect('/reminder');
    }

    let user = res.locals.user;
    console.log('contest id to be reminded : ', cont_id);
    console.log('email is : ', user.email);

 
    // add id to url  
    let url = process.env.URL3;
    url = url + cont_id;
    let email = user.email;

    let user_reminder = await User.Reminder.findOne({ email });
    // check if any remider with this user is present in DB or its first time
    if(!user_reminder){
        user_reminder=new User.Reminder({
            email : user.email  ,
            recorded_ids : []
        })
    }
   user_reminder.recorded_ids.push(cont_id);
   reminded_contest_ids[cont_id] =true; 

   // save in db 
   await user_reminder.save();



    fetch(url)
        .then((response) => response.json())
        .then((data) => {

            // schedule email as per contest date
            let cont_info = data.objects[0];
            let contest_date = cont_info.start;

            let description = `Attention! This is to remind you that ${cont_info.host} will hold ${cont_info.event} on ${cont_info.start}.

    To participate follow the link below :  

             Host : ${cont_info.host}
             Contest URL : ${cont_info.href}`


            // e-mail message options
            let mailOptions = {
                from: process.env.OwnerEmail,
                to: user.email,
                subject: 'Contest Reminder',
                text: description
            };

            // e-mail transport configuration
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.OwnerEmail,
                    pass: process.env.AppPass
                }
            });

           
           // extracting dates  
           let year=contest_date.substring(0,4);
           let month=contest_date.substring(5,7);
           let date=contest_date.substring(8,10);
           month--; // dur to zero based indexing
 
           let somedate=new Date(year,month,date,0,0,0);
        //    if contest is today then send email or shcedule on the given date
           if(year==new Date.getFullYear() && date==new Date.getDate() && month==new Date.getMonth()){
                const info= transporter.sendMail(mailOptions);   
                console.log("Email sent", info.messageId);   
           }
           else{
                schedule.scheduleJob(somedate, async() => {
                    const info= transporter.sendMail(mailOptions);   
                    console.log("Email sent", info.messageId);               
                })
           }
         

            
           // Demo scheduling
            // const date = new Date(2023, 6, 13, 0, 45, 0);

            // const job = schedule.scheduleJob(date, async function () {
            //     const info = await transporter.sendMail(mailOptions);
            //     console.log('The world is going to end today and mail sent.');
            // });

            res.redirect('/reminder');


        })
        .catch((err) => {
            console.log('Error in Reminder setting',err);
            res.redirect('/reminder');
        })



});
