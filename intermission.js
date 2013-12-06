if (Meteor.isClient) {
  Template.scoreboard.games = function () {
    return Games.find({bs: 'LIVE'}, {sort: {id: 1}});
  };
  var count = 0;

  Template.scoreboard.upcoming = function () {
    var today = moment().format('dddd MM/D').toUpperCase();
    console.log(today);
    return Games.find({ts: {$in: ['TODAY', today]}}, {sort: {id: 1}});
  };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.setInterval(refreshGames, 1000);
  });
}