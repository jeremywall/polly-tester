var express = require('express');
var router = express.Router();

router.post('/test', function(req, res, next) {
  var AWS = req.app.locals.AWS;
  var polly = new AWS.Polly();

  var params = {
      OutputFormat: 'mp3',
      Text: req.body.text, //'<speak>Hey there Brian, I just love that push you made to Git Hub. Talk with you later <break time="250ms"/>  tootles!</speak>', //req.body.text,
      VoiceId: 'Salli',
      TextType: (req.body.text.indexOf('<speak>') !== -1) ? 'ssml' : 'text'
  };

  polly.synthesizeSpeech(params, function (err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log(data);
        // res.writeHead(200, {
        //   'Content-Type': data.ContentType,
        //   'Content-Length': data.AudioStream.length
        // });
        res.send(data.AudioStream);
      }
  });
});

module.exports = router;
