# Message-Sorter
User bot that reads messages from users and bots and can sort and edit them and transmit to users / other channels.



How to install:
Open console and execute the following commands:

`mkdir Mybot`

`cd Mybot`

`git clone https://github.com/justalike/Message-Sorter.git`

depending on what modules manager you prefer you can do both

`npm install`

or

`yarn`

After the modules been installed you would need to launch the bot with:
`node bot.js`


To make bot work with your own user profile:
create `.env` file in the bot folder and add the following lines:
```
TELEGRAM_API_TOKEN="5253426459:ABGZafP4BN1CySOqp5kC-eE2xr68K5WTWz4"
API_ID="13207521"
API_HASH="7f5012394534cb4a29123e123123548"
phone="+7900xxxxxxxxx"
code="xxxx"
```
Telegram API token is the authorization token you can get from the following link: 
https://my.telegram.org/auth?to=apps
Login there with your preferred phone number, enter the confirmation code and you will see the following menu:
![test(1)](https://user-images.githubusercontent.com/44633493/199740770-f064d575-bf8b-4dda-9963-c5a7d3ff5dc9.png)

Your API id goes to API_ID="Number",
Your API hash goes to API_HASH="Hash"

Replace `number` with the correct api id and `hash` with the correct hash you see in telegram apps.

`Phone` variable is working phone number you wish to log in to. Use international format.
`code` variable will be sent to your phone number when you first try to log in. Edit this field as soon as you get the code in Telegram messages or SMS.

After environment variables are set you're done and your bot will be online.

How to set your channel:


How to set your user/group to receive notifications:


How to set up your own filters:


How to edit messages: 
