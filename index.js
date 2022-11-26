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
app.use(express.urlencoded());
app.use(authRoutes);
app.use('/images', express.static('images'));

//apply this middleware to every single route   
app.get('*', checkUser);
app.post('*', checkUser);

// use res.render to load up an ejs view file


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




var reminded_cont;

// index page

app.get('/home', function (req, res) {


    let url = process.env.URL2;
    fetch(url)
        .then((response) => response.json())
        .then((data) => res.render('pages/index', { contests: data, getTime: secondsToString, val: 1 }));

});

app.get('/', (req, res) => {
    res.redirect('/home');
});



app.post('/', function (req, res) {

    let url = process.env.URL1;
    let filtered_json = req.body
    console.log(filtered_json);

    let source = '#';
    let prv = 0;
    if (filtered_json.CodeForces != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'codeforces.com';
    }
    if (filtered_json.CodeChef != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'codechef.com';
    }
    if (filtered_json.AtCoder != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'atcoder.jp';
    }
    if (filtered_json.HackerEarth != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'hackerearth.com';
    }
    if (filtered_json.HackerRank != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'hackerrank.com';
    }
    if (filtered_json.LeetCode != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'leetcode.com';
    }
    url = url + (source.substring(1));

    console.log('src', source);


    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            res.render('pages/index', { contests: data, getTime: secondsToString, val: 0 })
        });

});





// reminder pages

app.get('/reminder', requireAuth, async (req, res) => {
    let user = res.locals.user;
    let email = user.email;
    const u_rems = await User.Reminder.findOne({ email });
    reminded_cont = u_rems.recorded_ids;

    let url = process.env.URL2;
    try{
    fetch(url)
        .then((response) => response.json())
        .then((data) => res.render('pages/reminder', { contests: data, getTime: secondsToString, val: 1, records: reminded_cont }));
    }
    catch(e){
        console.log('ERROR IN loading reminder : ',e);
    }

  })

app.post('/reminder', async function (req, res) {
    let user = res.locals.user;
    let email = user.email;
    const u_rems = await User.Reminder.findOne({ email });
    reminded_cont = u_rems.recorded_ids;

    let url = process.env.URL1;
    let filtered_json = req.body
    console.log(filtered_json);

    let source = '#';
    let prv = 0;
    if (filtered_json.CodeForces != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'codeforces.com';
    }
    if (filtered_json.CodeChef != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'codechef.com';
    }
    if (filtered_json.AtCoder != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'atcoder.jp';
    }
    if (filtered_json.HackerEarth != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'hackerearth.com';
    }
    if (filtered_json.HackerRank != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'hackerrank.com';
    }
    if (filtered_json.LeetCode != undefined) {
        if (prv) source = source + ',';
        prv = 1;
        source = source + 'leetcode.com';
    }
    url = url + (source.substring(1));

    console.log('src', source);

    try{
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            res.render('pages/reminder', { contests: data, getTime: secondsToString, val: 0, records: reminded_cont })
        });
    }
    catch(e){
        console.log('ERROR IN loading reminder : ',e);
    }   

});




// ................. EMAIL REMINDER .........................

let cron = require('node-cron');
let nodemailer = require('nodemailer');
const schedule = require('node-schedule');



app.get('/setrem/:id', async (req, res) => {


    var cont_id = req.params.id;
    if (cont_id == undefined) {
        res.redirect('/reminder');
    }

    let user = res.locals.user;
    console.log('contest id to be reminded : ', cont_id);
    console.log('email is : ', user.email);


    let url = process.env.URL3;
    url = url + cont_id;
    let email = user.email;

    let u_rems = await User.Reminder.findOne({ email });
    reminded_cont = u_rems.recorded_ids;

    u_rems.recorded_ids.push(cont_id);
    await u_rems.save();


    try {
        fetch(url)
            .then((response) => response.json())
            .then((data) => {

                let cont_info = data.objects[0];
                let contest_date = cont_info.start;
                let tmp = contest_date.substring(0, 11);
                tmp = tmp + '00:00:01';
                const somedate = new Date(tmp);

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



                schedule.scheduleJob(somedate, () => {
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });

                })
                
        
                     res.redirect('/reminder');
                          
               
            });

    } catch (e) {
        console.log('ERROR IN CONTEST FETCHING : ',e);
    }
     

});
