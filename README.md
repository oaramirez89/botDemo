# Demo Messenger Bot

This demo project creates a Facebook Messenger bot that demonstrates the 
interaction between a bot and a Camunda Decision as well as a Workflow.

The bot invokes a Camunda DMN (Decision Model Notation) model to suggest
a dish to cook to the user. Once the dish is selected, the user is asked
if they need guidance cooking the dish.

To guide the user through the recipe, the bot invokes a Camunda BPM (Business Process Model) model which maps the steps required to cook the selected dish.

This is a proof of concept and the bot is coded to work only for the demo. It
is not the author's intent to create a cooking bot, but only to demonstrate
how a bot may interact with decision and workflow execution models.

Oscar A. Ramirez

The decision table show in the following picture was used to decide what dish to prepare. The bot asks user to enter the number of guests expected for dinner.
 
![alt text](https://cdn.glitch.com/09c5fb51-1714-474d-bcca-ccede5088c33%2FScreen%20Shot%202017-09-24%20at%203.24.22%20PM.png?1506281133113 "Dish Decision Table")

Once the dish is selected the dish key is used to look up the appropriate recipe workflow. In the image below we see the Beef Stew recipe. The bot walks user through the recipe steps. 

![alt text](https://cdn.glitch.com/09c5fb51-1714-474d-bcca-ccede5088c33%2FScreen%20Shot%202017-09-24%20at%203.23.44%20PM.png?1506281121749 "Stew Recipe Workflow")

REST calls are used to interact with the workflow server. Bot starts the workflow using the process definition key. Bot renders each step by querying for the next User Task for the active process. When user tells the bot it is done with that step, the bot completes the task.

When no more user tasks exist, bot sends a 'You are done!' text. 

![alt text](https://cdn.glitch.com/09c5fb51-1714-474d-bcca-ccede5088c33%2FScreen%20Shot%202017-09-24%20at%203.34.58%20PM.png?1506281732531 "Bot in action.")

The video link below goes over a quick demo of the functionality included in this repo.

[Bot Demo](https://youtu.be/yprUvUCE2iU)


