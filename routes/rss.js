var express = require('express');
var router = express.Router();
var parser = require('rss-parser');
var striptags = require('striptags');

router.get('/', function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  var rssUrl = req.query.url;
  if(rssUrl === undefined) {
    res.statusCode = 500;
    res.send(JSON.stringify({error: 'not set rss url'}));
  }
  console.log(rssUrl);
  var jsonData = {items: {},stat: {message: 0, author: 0}};
  var authorList = [];
  parser.parseURL(rssUrl, function(err, parsed) {
    if (err) return next(err);
    parsed.feed.entries.forEach(function(item,key) {
      item.content = striptags(item.content);
      if (authorList.indexOf(item.author) === -1 && item.author)
        authorList.push(item.author);
      jsonData['items'][key] = item;
      jsonData['stat']['message']++;
    });

    jsonData['stat']['author'] = authorList.length || 0;
    res.send(JSON.stringify(jsonData));
  });
});

module.exports = router;

