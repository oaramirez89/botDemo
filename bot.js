//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const axios = require('axios');
const path = require('path');
var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<script src=\"https://button.glitch.me/button.js\" data-style=\"glitch\"></script><div class=\"glitchButton\" style=\"position:fixed;top:20px;right:20px;\"></div></body></html>";

// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post('/webhook', function (req, res) {
  console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);   
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
      case 'Dinner suggestions':
        sendQuestionOnGuests(senderID);
        break;
      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);
  let intPayload = Number.parseInt(payload);
  console.log('intPayload = ', intPayload)
  if (intPayload === 8 || intPayload === 10) {
    getDinnerSuggestion(senderID, intPayload);
  } else {

    // When a postback is called, we'll send a message back to the sender to 
    // let them know it was successful
    sendTextMessage(senderID, "Postback called with " + payload);
  }
}

//////////////////////////
// Sending helpers
//////////////////////////

function sendQuestionOnGuests(recipientId){
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "How many guests for dinner?",        
            image_url: "https://cdn.glitch.com/09c5fb51-1714-474d-bcca-ccede5088c33%2Fautumn_leaves_PNG3601.png?1506212196498",
            buttons: [{
              type: "postback",
              title: "Eight or less",
              payload: "8"
            }, {
              type: "postback",
              title: "More than eight",
              payload: "10",
            }],
          }]
        }
      }
    }
  }
  callSendAPI(messageData);
}

function getDinnerSuggestion(recipientId, nbrOfGuests){
  let messageData = {
    "variables" : {
        "guestCount" : { "value" : nbrOfGuests, "type" : "Integer" },
                         "season" : { "value" : "Fall", "type" : "String" }
                       }        
  }
  
  return axios.post(process.env.CAMUNDA_HOME + '/engine-rest/decision-definition/key/dish/evaluate', messageData)
      .then(response => response.data)
      .then(dishSelection => {
        sendDinnerSuggestion(recipientId, dishSelection[0].desiredDish.value);
      })
      .catch(error => {
        console.error("Could not invoke decision rule.");
        console.error(error);
      })
}

function sendDinnerSuggestion(recipientId, desiredDish){
  let messageToSend;
  
  switch (desiredDish) {
    case 'Spareribs':
      messageToSend = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Barbequed Ribs",
            subtitle: "Two day ribs, but worth the effort. Baked and marinated with a rub overnight, then grilled with barbecue sauce.",
            item_url: "http://allrecipes.com/recipe/19856/barbequed-ribs/?internalSource=recipe%20hub&referringContentType=search%20results&clickId=cardslot%2040",               
            image_url: "https://cdn.glitch.com/09c5fb51-1714-474d-bcca-ccede5088c33%2FSpareRibs.jpg?1506253844983",
            buttons: [{
              type: "web_url",
              url: "http://allrecipes.com/recipe/19856/barbequed-ribs/?internalSource=recipe%20hub&referringContentType=search%20results&clickId=cardslot%2040",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Help me cook it",
              payload: "Spareribs",
               }],
            }]
          }
        }
      }
      break;
    case 'Stew':
      messageToSend = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Beef Stew VI",
            subtitle: "Thick beef stew good eaten from a bowl or poured over biscuits",
            item_url: "http://allrecipes.com/recipe/25678/beef-stew-vi/?internalSource=hn_carousel%2001_Beef%20Stew&referringId=14730&referringContentType=recipe%20hub&referringPosition=carousel%2001",               
            image_url: "https://cdn.glitch.com/09c5fb51-1714-474d-bcca-ccede5088c33%2FBeefStew.jpg?1506254336197",
            buttons: [{
              type: "web_url",
              url: "http://allrecipes.com/recipe/25678/beef-stew-vi/?internalSource=hn_carousel%2001_Beef%20Stew&referringId=14730&referringContentType=recipe%20hub&referringPosition=carousel%2001",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Help me cook it",
              payload: "Stew",
               }],
            }]
          }
        }
      }
      break;
    default:
      messageToSend = { text: desiredDish}
  }
  
  let messageData = {
    recipient: {
      id: recipientId
    },
    message: messageToSend
  };;
  
  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});