const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
// const axios = require('axios')
// const { stringify } = require('querystring')
// const { get } = require('http')
// var mainWindow;
function createHomeWindow() {
  mainWindow = new BrowserWindow({
    width: 1150,
    height: 665,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,

  })
  mainWindow.loadFile('index.html')
}
function createChoiceWindow() {
  choiceWindow = new BrowserWindow({
    width: 1150,
    height: 665,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true
  })
  choiceWindow.loadFile('choice.html')
}
function createVoiceWindow() {
  voiceWindow = new BrowserWindow({
    width: 1150,
    height: 665,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true
  })

  voiceWindow.loadFile('voice.html')
}
function createChatWindow() {
  chatWindow = new BrowserWindow({
    width: 445,
    height: 710,
    x: 1050,
    y: 5,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    resizable: false
    // alwaysOnTop:true
  })

  chatWindow.loadFile('chat.html')
}

// ###################################################################################################
// Windows ^ above
// ###################################################################################################

async function requestSay(data) {
  console.log("going to say :" + data)
  var dataToSend = { 'text': data, }
  await fetch('http://127.0.0.1:1000/say', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  }).then((r) => r.json())
    .then((data) => {
      console.log(data['h'])
      fetchVoiceData()
    }).catch(error => {
      console.log(error);
    });
}
async function fetchResponse(data,isAi) {
  console.log("fetch response called")
  var dataToSend = { 'query': data, }
  await fetch('http://127.0.0.1:1000/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  }).then((r) => r.json())
    .then((data) => {
      console.log(data['response'])
      if (isAi)
      {voiceWindow.webContents.send('pixel', {
        'pixel': data['response']
      })
        requestSay(data['response'])}
      else 
        {
          console.log("sending to Frontend")
          chatWindow.webContents.send('response',{
            'pixel':data['response']
          })
        }
    }).catch(error => {
      console.log(error);
    });
}

async function fetchVoiceData() {
  console.log("fetching new data")
  var res = await fetch('http://127.0.0.1:1000/start/voice'
  ).then(res => res.json())
    .then((data) => {
      voiceWindow.webContents.send('user', {
        'user': data['query']
      })
      console.log(data['isExit'])
      if (data['isExit'] == "No") {
        console.log(data['query'])
        callTofetchResponse = async () => await fetchResponse(data['query'], true)
        callTorequestSay = async () => await requestSay(data['response'])
        if (data['isAi'] == 'yes')
          callTofetchResponse()
        else
          callTorequestSay()
        console.log("fetchecd")
      }
    }).catch(error => {
      console.error('Fetch error:', error.message);
    });
}
async function fetchChatData(text){
  console.log("fetching chat new data")
  dataToSend={'text':text};
  var res = await fetch('http://127.0.0.1:1000/start/chat',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  }).then(res => res.json())
    .then((data) => {

        console.log(data['response'])

        callTofetchResponse = async () => await fetchResponse(data['query'], false)
        callTorequestSay = async () => await requestSay(data['response'])
        if (data['isAi'] == 'yes')
          callTofetchResponse()
        else{
              console.log("sending to Frontend")
              chatWindow.webContents.send('response',{
                'pixel':data['response']
              })
            }

          // callTorequestSay()
        console.log("fetchecd")
      // }
    }).catch(error => {
      console.error('Fetch error:', error.message);
    });
}
// ###################################################################################################
// Fetch Functions ^ above
// ###################################################################################################

ipcMain.on('choiceVoice', () => {
  createVoiceWindow()
  choiceWindow.close()
})
ipcMain.on('choiceChat', () => {
  createChatWindow()
  choiceWindow.close()
})
ipcMain.on('choiceRoleplay', () => {
  createRolePlayWindow()
  choiceWindow.close()
})
ipcMain.on('start', () => {
  console.log('from main start')
  createChoiceWindow();
  mainWindow.close();

})
ipcMain.on('voice', async (e) => {
  await fetchVoiceData()
})
ipcMain.on('userChat', async (e, data) => {
  await fetchChatData(data);
})
app.whenReady().then(() => {
  createHomeWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createHomeWindow()
  })
})
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// ###################################################################################################
// ON commands (Event Handling) ^ above
// ###################################################################################################
