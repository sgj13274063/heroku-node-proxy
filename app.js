/***************
 * node-unblocker: Web Proxy for evading firewalls and content filters,
 * similar to CGIProxy or PHProxy
 *
 *
 * This project is hosted on github:  https://github.com/nfriedly/node-unblocker
 *
 * By Nathan Friedly - http://nfriedly.com
 * Released under the terms of the GPL v3
 */
var url = require('url');
var querystring = require('querystring');
var express = require('express');
var unblocker = require('./lib/unblocker.js');
var Transform = require('stream').Transform;

var app = express();

var google_analytics_id = process.env.GA_ID || null;
var  q="请输入用户名：";


var  users= {

"admin":"123",

"user1":"321",

"user2":"213"

};

//输出第一个友好提示

process.stdout.write(q);


//定一个标示判断是用户账户还是密码的输入

var isInputUsername=true;

var username='';

process.stdin.on("data", (input) => {

//process.stdout.write(input+"")

//要在此处知道到底input是啥？

//获取一个键值对中集合所有的键

input = input.toString().trim();

if(isInputUsername) {

if(Object.keys(users).indexOf(input) === -1) {

//用户名不存在

process.stdout.write('用户名不存在'+"\n");

process.stdout.write(q+"\n")

isInputUsername=true;

username="";

}else{

// console.log("存在")

process.stdout.write("请输入密码：")

isInputUsername=false;

username=input;

}

}else{

//传入的是密码,此时拿不到上次的输入，所以拿不到用户名

if(input===users[username]){

console.log("登录成功")

}else{

process.stdout.write("请输入密码：")

}

}


function addGa(html) {
    if (google_analytics_id) {
        var ga = [
            "<script type=\"text/javascript\">",
            "var _gaq = []; // overwrite the existing one, if any",
            "_gaq.push(['_setAccount', '" + google_analytics_id + "']);",
            "_gaq.push(['_trackPageview']);",
            "(function() {",
            "  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;",
            "  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';",
            "  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);",
            "})();",
            "</script>"
            ].join("\n");
        html = html.replace("</body>", ga + "\n\n</body>");
    }
    return html;
}

function googleAnalyticsMiddleware(data) {
    if (data.contentType == 'text/html') {

        // https://nodejs.org/api/stream.html#stream_transform
        data.stream = data.stream.pipe(new Transform({
            decodeStrings: false,
            transform: function(chunk, encoding, next) {
                this.push(addGa(chunk.toString()));
                next();
            }
        }));
    }
}

var unblockerConfig = {
    prefix: '/proxy/',
    responseMiddleware: [
        googleAnalyticsMiddleware
    ]
};



// this line must appear before any express.static calls (or anything else that sends responses)
app.use(unblocker(unblockerConfig));

// serve up static files *after* the proxy is run
app.use('/', express.static(__dirname + '/public'));

// this is for users who's form actually submitted due to JS being disabled or whatever
app.get("/no-js", function(req, res) {
    // grab the "url" parameter from the querystring
    var site = querystring.parse(url.parse(req.url).query).url;
    // and redirect the user to /proxy/url
    res.redirect(unblockerConfig.prefix + site);
});

// for compatibility with gatlin and other servers, export the app rather than passing it directly to http.createServer
module.exports = app;
