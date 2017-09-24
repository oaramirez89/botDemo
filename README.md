# Fullstack Academy Stackathon Demo Messenger Bot

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
