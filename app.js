var express = require('express');
var path = require('path');
var Writable = require('stream').Writable;
var Readable = require('stream').Readable;
var util = require('util');
// var fs = require ('fs');
var Twitter = require ('twitter');
var pubnub = require("pubnub");

var port = process.env.PORT || 3000;

// Init app
var app = express();

app.use(express.static(__dirname + '/public'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')

//home route
app.get('/', function(req, res) {
    res.render('pages/index');
});





var pncfg = {
   ssl           : true,  //  enable TLS Tunneling over TCP
   publish_key   : "pub-c-a1a90a3b-9029-4e4a-8e52-084face7596d",
   subscribe_key : "sub-c-a87b7852-6521-11e8-902b-b2b3cb3accda"
};

var twcfg = {
 consumer_key:"CPKz5lp8bWjf6qWZPpAfgASKO",
   consumer_secret:"Yc3qdVcHa7a7RTbSgIkMaAi9KFhahwvpTul5jB0g0i6DjqTcWP",
   access_token_key:"961613493207293952-d0fx7eGPRqqRjaclHG6nENIfru8EVmd",
   access_token_secret:"j6dpgMjni2iBocMbbaGAGvAekG6Un9LjQ5HijPMhIML6A"
}


function TwitterStream(cfg, query) {
    Readable.call(this, {objectMode: true});

    var client = new Twitter(cfg);

    this._read = function() { /* do nothing */};
    var self = this;
    function connect() {
        client.stream('statuses/filter', {track: query}, function(stream) {
            stream.on('data', (tweet) => self.push(tweet));
            stream.on('error', (error) => connect());
        });
    }
    connect();
}

util.inherits(TwitterStream, Readable);

function PubNubStream(cfg, channel) {
    Writable.call(this, {objectMode: true});
    var pn = new pubnub(cfg);

    this._write = function(obj, encoding, callback) {
        pn.publish({
            channel: channel,
            message: obj,
            callback: callback()
        });
    };

}

util.inherits(PubNubStream, Writable);

new TwitterStream(twcfg, "pascolead, ourghs17").pipe(new PubNubStream(pncfg, "rugby-tweets"));


//start server
app.listen(port, function() {
    console.log("Server started")
})