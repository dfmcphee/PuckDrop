if (Meteor.isClient) {
  Template.scoreboard.games = function () {
    return Games.find({bs: 'LIVE'}, {sort: {id: 1}});
  };
  var count = 0;

  Template.scoreboard.upcoming = function () {
    var today = moment().format('dddd MM/D').toUpperCase();
    return Games.find({ts: {$in: ['TODAY', today]}}, {sort: {id: 1}});
  };
  
  Template.scoreboard.details = function () {
    return Session.equals("show_details", "true") ? "details" : '';
  };
  
  Template.scoreboard.events({
    'click input.hide-details': function () {
      Session.set("selected_game", '');
      Session.set("show_details", '');
    }
  });
  
  Template.game.events({
    'click input.show-details': function () {
      Session.set("selected_game", this._id);
      Session.set("show_details", 'true');
      top.location = "#details";
    }
  });
  
  Template.game.getPlays = function (plays) {
    if (plays.length > 10) {
      plays = plays.slice(0, 10);
    }
    return plays;
  }

  Template.game.selected = function () {
    return Session.equals("selected_game", this._id) ? "selected" : '';
  };
  
  Template.scoreboard.selected = function () {
    selected = Session.get("selected_game");
    
    if (selected && selected !== '') {
      selected = 'selected'
    } else {
      selected = '';
    }
    
    return selected;
  };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.setInterval(refreshGames, 1000);
  });
}