Games = new Meteor.Collection("games");

checkIntermission = function (gameResponse, game) {
  if (!game.intermission && (gameResponse.ts === 'END 1st' && game.ts !== 'END 1st')) {
    console.log('End of the 1st.');
    gameResponse.intermission = true;
    var d = new Date();
    gameResponse.intermissionStart = d.getTime();
  }
  else if (!game.intermission && (gameResponse.ts === 'END 2nd' && game.ts !== 'END 2nd' )) {
    console.log('End of the 2nd.');
    gameResponse.intermission = true;
    var d = new Date();
    gameResponse.intermissionStart = d.getTime();
  }
  else if (game.intermission && (game.ts === 'END 1st' && gameResponse.ts !== 'END 1st')) {
    console.log('Start of the 2nd.');
    gameResponse.intermission = false;
  }
  else if (game.intermission && (game.ts === 'END 2nd' && gameResponse.ts !== 'END 2nd')) {
    console.log('Start of the 3rd.');
    gameResponse.intermission = false;
  }
  
  if (gameResponse.intermission) {
    console.log('Calculating time left in intermission.');
    var countdown = moment(Number(gameResponse.intermissionStart)).add('minutes', 18);
    var currentTime = new Date().getTime();
    var diffTime = currentTime - gameResponse.intermissionStart;
    var duration = moment.duration(diffTime, 'milliseconds');

    gameResponse.countdown = 'Next period ' + countdown.fromNow();
  } else {
    gameResponse.countdown = '';
  }
  
  return gameResponse;
};

refreshGames = function() {
  var d = new Date();
  var url = "http://live.nhle.com/GameData/RegularSeasonScoreboardv3.jsonp?callback=?" + d.getTime();
  HTTP.get(url, {params: {t: d.getTime()}, headers: {'Cache-Control': 'no-cache'}},
      function (error, result) {
        if (!error) {
          var res = result.content.slice(result.content.indexOf('{'), result.content.lastIndexOf('}') + 1);
          res = JSON.parse(res);
          
          console.log('Refreshed games from: ' + url);
          
          for (var i=0; i < res.games.length; i++) {
              game = Games.findOne({id: res.games[i].id}, {});
              res.games[i].plays = false;
              
              if (typeof(game) !== 'undefined' && game) {
                if (game.intermission) {
                  res.games[i].intermission = true;
                  res.games[i].intermissionStart = game.intermissionStart;
                }
                if (game.plays) {
                  res.games[i].plays = game.plays;
                }
                if (game.goals) {
                  res.games[i].goals = game.goals;
                }

                if (game.awayShots && game.homeShots) {
                  res.games[i].awayShots = game.awayShots;
                  res.games[i].homeShots = game.homeShots;
                }
                if (res.games[i].bs === 'LIVE') {
                    if (!game.intermission) {
                      refreshEvents(game.id);
                    }
                    
                    if (game.currentEvent) {
                      res.games[i].currentEvent = game.currentEvent;
                    }
                    
                    if (game.lastGoal) {
                      res.games[i].lastGoal = game.lastGoal;
                    }
                    
                    res.games[i] = checkIntermission(res.games[i], game);
                    
                    if (!game.intermission && (res.games[i].ts !== game.ts)) {
                      game.clockTime = new Date().getTime();
                    }
                    
                    if (game.clockRunning) {
                      res.games[i].clockRunning = game.clockRunning;
                      res.games[i].clockTime = game.clockTime;
                      
                      var time = res.games[i].ts.split(' ')[0];
                      var currentTime = new Date().getTime();
                      var diffTime = currentTime - game.clockTime;
                      var difference = moment.duration(diffTime, 'milliseconds');
                      var duration = moment.duration("00:" + time).subtract(difference);

                      res.games[i].timeRemaining = moment.utc(duration.asMilliseconds()).format("mm:ss") + ' ' + res.games[i].ts.split(' ')[1];
                    } else {
                      res.games[i].timeRemaining = res.games[i].ts;
                    }
                } else {
                   res.games[i].timeRemaining = res.games[i].ts;
                } 
                
                Games.update({id: game.id}, res.games[i]);
              } else {
                Games.insert(res.games[i]);
              }
          }
        }
  });
};