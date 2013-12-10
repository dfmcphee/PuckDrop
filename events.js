Events = new Meteor.Collection("events");

refreshEvents = function(gameId) {
  var d = new Date();
  var url = "http://live.nhle.com/GameData/20132014/" + gameId + "/gc/gcsb.jsonp?GCSB.load=jQuery" + d.getTime();
  HTTP.get(url, {params: {t: d.getTime()}, headers: {'Cache-Control': 'no-cache'}},
      function (error, result) {
        var res = result.content.slice(result.content.indexOf('{'), result.content.lastIndexOf('}') + 1);
        res = JSON.parse(res);

        if (!error) {
          var game = Games.findOne({id: gameId}, {});
          if (typeof(game) !== 'undefined' && game && res && res.le) {
            if (!game.currentEvent) {
              game.currentEvent = {};
            }
            if (!game.plays) {
              game.plays = [];
            }
            if (!game.goals) {
              game.goals = [];
            }
            
            if (game.currentEvent.le && res.le.id !== game.currentEvent.le.id) {
              game.plays.unshift(res); 
            }
            
            if (res.le && res.le.type === "505" || res.le && res.le.type === 505 ) {
              if (!game.lastGoal) {
                game.goals.push(res);
                game.lastGoal = res;
              }
              else if (game.lastGoal.le && res.le.id !== game.lastGoal.le.id) {
                game.goals.push(res);
                game.lastGoal = res;
              }
            }
            
            if (res.h.tot.s && res.a.tot.s) {
              game.awayShots = res.a.tot.s;
              game.homeShots = res.h.tot.s;
            }
            
            if (game.currentEvent.cr === false && res.cr === true) {
              console.log('Starting clock.');
              game.clockRunning = true;
              var d = new Date();
              game.clockTime = d.getTime();
            } else if (game.currentEvent && game.currentEvent.cr === true && res.cr === false) {
              console.log('Stopping clock.');
              game.clockRunning = false;
              game.timeRemaining = game.ts.split(' ')[0];
            }
            
            game.currentEvent = res;
            Games.update({id: game.id}, game);
          }
        }
  });
}