Games = new Meteor.Collection("games");

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
            
              if (typeof(game) !== 'undefined' && game) {
                //console.log('Game already exists. Updating...');
                if (game.intermission) {
                  res.games[i].intermission = true;
                  res.games[i].intermissionStart = game.intermissionStart;
                }
                if (res.games[i].bs === 'LIVE') {
                    if (!game.intermission) {
                      refreshEvents(game.id);
                    }
                    
                    if (game.currentEvent) {
                      res.games[i].currentEvent = game.currentEvent;
                    }
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
                    
                    if (!game.intermission && (res.games[i].ts === 'END 1st' && game.ts !== 'END 1st')) {
                      console.log('End of the 1st.');
                      res.games[i].intermission = true;
                      var d = new Date();
                      res.games[i].intermissionStart = d.getTime();
                    }
                    else if (!game.intermission && (res.games[i].ts === 'END 2nd' && game.ts !== 'END 2nd' )) {
                      console.log('End of the 2nd.');
                      res.games[i].intermission = true;
                      var d = new Date();
                      res.games[i].intermissionStart = d.getTime();
                    }
                    else if (game.intermission && (game.ts === 'END 1st' && res.games[i].ts !== 'END 1st')) {
                      console.log('Start of the 2nd.');
                      res.games[i].intermission = false;
                    }
                    else if (game.intermission && (game.ts === 'END 2nd' && res.games[i].ts !== 'END 2nd')) {
                      console.log('Start of the 3rd.');
                      res.games[i].intermission = false;
                    }
                    
                    if (res.games[i].intermission) {
                      console.log('Calculating time left in intermission.');
                      var countdown = moment(Number(res.games[i].intermissionStart)).add('minutes', 18);
                      var currentTime = new Date().getTime();
                      var diffTime = currentTime - res.games[i].intermissionStart;
                      var duration = moment.duration(diffTime, 'milliseconds');

                      res.games[i].countdown = 'Next period ' + countdown.fromNow();
                    } else {
                      res.games[i].countdown = '';
                    }
                } else {
                   res.games[i].timeRemaining = res.games[i].ts;
                } 
                
                
                Games.update({id: game.id}, res.games[i]);
              } else {
                //console.log('Game not found. Inserting...');
                Games.insert(res.games[i]);
              }
          }
        }
  });
};