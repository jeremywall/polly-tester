var express = require('express');
var router = express.Router();

router.post('/test', function (req, res, next) {
    var twilio = req.app.locals.twilio;
    var AWS = req.app.locals.AWS;
    var polly = new AWS.Polly();
    var s3 = new AWS.S3({
        region: 'us-east-1'
    });

    if (req.body.password !== process.env.BUCKETNAME) {
        res.json({status: 'bad password'});
    }

    var params = {
        OutputFormat: 'mp3',
        Text: req.body.message, //'<speak>Hey there Brian, I just love that push you made to Git Hub. Talk with you later <break time="250ms"/>  tootles!</speak>', //req.body.text,
        VoiceId: 'Salli',
        TextType: (req.body.message.indexOf('<speak>') !== -1) ? 'ssml' : 'text'
    };

    polly.synthesizeSpeech(params, function (err, data) {
        if (err) {
            console.log('synthesizeSpeech err', err);
            res.json(err);
        } else {
            console.log('synthesizeSpeech ok');
            var ts = (new Date).getTime();
            var bucketName = process.env.BUCKETNAME;
            var s3Params = {
                Bucket: bucketName,
                Key: ts + '.mp3',
                ACL: 'public-read',
                Body: data.AudioStream,
                ContentType: 'audio/mpeg',
                Expires: (ts / 1000) + (120)
            };
            s3.putObject(s3Params, function (err, data) {
                if (err) {
                    console.log('putObject mp3 err');
                    res.json(err);
                } else {
                    console.log('putObject mp3 ok');

                    s3Params = {
                        Bucket: bucketName,
                        Key: ts + '.xml',
                        ACL: 'public-read',
                        Body: '<?xml version="1.0" encoding="UTF-8"?>' +
                        '<Response>' +
                        '<Play>' + 'https://s3.amazonaws.com/' + bucketName + '/' + ts + '.mp3' + '</Play>' +
                        '</Response>'
                        ,
                        ContentType: 'text/xml',
                        Expires: (ts / 1000) + (120)
                    };

                    s3.putObject(s3Params, function (err, data) {
                        if (err) {
                            console.log('putObject xml err');
                            res.json(err);
                        } else {
                            console.log('putObject xml ok');
                            twilio.calls.create({
                                url: 'https://s3.amazonaws.com/' + bucketName + '/' + ts + '.xml',
                                to: req.body.to,
                                from: req.body.from,
                                method: 'GET'
                            }, function (err, call) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(call.sid);
                                }
                            });
                            res.json({status: 'ok'});
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
