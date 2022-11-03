import 'dotenv/config';

import MTProto from "@mtproto/core"
import path from "path"
import { sleep }  from "@mtproto/core/src/utils/common/index.js"

class API {
    constructor() {
      this.mtproto = new MTProto({
        api_id: process.env.API_ID,
        api_hash: process.env.API_HASH,
  
        storageOptions: {
            path: path.resolve('./', './data/data.json'),
        },
      });
    }
  
    async call(method, params, options = {}) {
      try {
        const result = await this.mtproto.call(method, params, options);
  
        return result;
      } catch (error) {
        console.log(`${method} error:`, error);
  
        const { error_code, error_message } = error;
  
        if (error_code === 420) {
          const seconds = Number(error_message.split('FLOOD_WAIT_')[1]);
          const ms = seconds * 1000;
  
          await sleep(ms);
  
          return this.call(method, params, options);
        }
  
        if (error_code === 303) {
          const [type, dcIdAsString] = error_message.split('_MIGRATE_');
  
          const dcId = Number(dcIdAsString);
  
          // If auth.sendCode call on incorrect DC need change default DC, because
          // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
          if (type === 'PHONE') {
            await this.mtproto.setDefaultDc(dcId);
          } else {
            Object.assign(options, { dcId });
          }
  
          return this.call(method, params, options);
        }
  
        return Promise.reject(error);
      }
    }
  }

  
  const api = new API();

  async function getUser() {
    try {
      const user = await api.call('users.getFullUser', {
        id: {
          _: 'inputUserSelf',
        },
      });
  
      return user;
    } catch (error) {
      return null;
    }
  }

  function sendCode(phone) {
    return api.call('auth.sendCode', {
      phone_number: phone,
      settings: {
        _: 'codeSettings',
      },
    });
  }
  function signIn({ code, phone, phone_code_hash }) {
    return api.call('auth.signIn', {
      phone_code: code,
      phone_number: phone,
      phone_code_hash: phone_code_hash,
    });
  }

  function signUp({ phone, phone_code_hash }) {
    return api.call('auth.signUp', {
      phone_number: phone,
      phone_code_hash: phone_code_hash,
      first_name: 'Pixel',
      last_name: 'MTPCore',
    });
  }
  function getPassword() {
    return api.call('account.getPassword');
  }
  function checkPassword({ srp_id, A, M1 }) {
    return api.call('auth.checkPassword', {
      password: {
        _: 'inputCheckPasswordSRP',
        srp_id,
        A,
        M1,
      },
    });
  }


  (async () => {
    const user = await getUser();
  
    const phone =  process.env.phone;
    const code = process.env.code;
  
    if (!user) {
      const { phone_code_hash } = await sendCode(phone);
  
      try {
        const signInResult = await signIn({
          code,
          phone,
          phone_code_hash,
        });
  
        if (signInResult._ === 'auth.authorizationSignUpRequired') {
          await signUp({
            phone,
            phone_code_hash,
          });
        }
      } catch (error) {
        if (error.error_message !== 'SESSION_PASSWORD_NEEDED') {
          console.log(`error:`, error);
  
          return;
        }
  
        // 2FA
  
        const password = 'USER_PASSWORD';
  
        const { srp_id, current_algo, srp_B } = await getPassword();
        const { g, p, salt1, salt2 } = current_algo;
  
        const { A, M1 } = await api.mtproto.crypto.getSRPParams({
          g,
          p,
          salt1,
          salt2,
          gB: srp_B,
          password,
        });
  
        const checkPasswordResult = await checkPassword({ srp_id, A, M1 });
      }
    }

  
///////  Bot should be logged in now.
///////  Any actions below would be executed 

    const allChats = await api.call('messages.getAllChats', {except_ids: 0})
    const alarmsChatId = 0 // Chat ID - Chat which messages you are listening ---- howtofind?
    const usrToFind =  await api.call('contacts.resolveUsername', {
        username: 'Pxl_RS', // Put your username as 'username'
      });


      const msgRecepient = usrToFind.users.find((chat) => chat.id === usrToFind.peer.user_id)
      const recipient = {
        _: 'inputPeerUser',
        user_id: msgRecepient.id,
        access_hash: msgRecepient.access_hash,
      };
  
  
    const alarmChat = allChats.chats.find(
      (chat) => chat.flags === alarmsChatId)
  
    const inputPeer = {
      _: 'inputPeerChannel',
      channel_id: alarmChat.id,
      access_hash: alarmChat.access_hash,
    };

      const LIMIT_COUNT = 10;
      const allMessages = [];
    
      const firstHistoryResult = await api.call('messages.getHistory', {
        peer: inputPeer,
        limit: LIMIT_COUNT,
      });
    
      const historyCount = firstHistoryResult.count;
    
      for (let offset = 0; offset < historyCount; offset += LIMIT_COUNT) {
        const history = await api.call('messages.getHistory', {
          peer: inputPeer,
          add_offset: offset,
          limit: LIMIT_COUNT,
        });
    
        allMessages.push(...history.messages);
      }

    // Function to edit received messages 

      function editBotMsg(msg){
        let newMsg;
        if (msg.includes('FILLED')) { // put any word instead of 'Filled' to filter.
         newMsg = msg.replace(/-  биржа:  #Binance\n-  тип:  LIMIT\n/gmi, '')
        // .replace('PARTIALLY_', '')
         .replace('FILLED', '')   // .replace('what-to-replace', 'replace-with-this')
         .replace(/-  исполнено: .+/gmi, '')
         .replace('-  размер: ', '')
        }
        if (msg.includes('pnl')){
          if (msg.includes('pnl: 0 ')) return
          newMsg = msg.replace(/-  биржа:  #Binance\n/gmi,'')
        }
        if (msg.includes('Стоплосс')){
          newMsg = msg.replace(/-  биржа:  #Binance\n/gmi,'СТОПЛОСС')
        }
        console.log(newMsg)
        return newMsg.replace(/^-\s*id:.+$/gmi, '')
      }

      function startListener() {
        console.log('[+] starting listener')
        api.mtproto.updates.on('updates', ({ updates }) => {
            const newChannelMessages = updates
            .filter((update) => update._ === 'updateNewChannelMessage')
            .map(({ message }) => message) // filter `updateNewChannelMessage` types only and extract the 'message' object
            for (const message of newChannelMessages) {
                // printing new channel messages
               // console.log(`received ${message.message} from ${message.peer_id.channel_id} channel`)
              //  console.log(message)

                if (message.message.includes('FILLED' )){
                  sendMessage(recipient, editBotMsg(message.message)) //
                }
            }
        });
    }


     // console.log('allMessages:', allMessages);

     

function sendMessage(chat, message) {

    api.call('messages.sendMessage', {
        clear_draft: true,
      
        peer: chat,
        message: message,
      
        random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
      });
    }
    startListener()
    sendMessage(recipient, `I'm online`)


  })();