import ext from 'webextension-polyfill'
import storage from './utils/storage'

ext.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    return new Promise((resolve, reject) => {
      if (request.action === 'perform-save') {
        console.log('Extension Type: ', '/* @echo extension */')
        console.log('PERFORM AJAX', request.data)
        storage.get('bookmarks').then(function (resp) {
          const data = JSON.parse(request.data)
          const bookmarks = resp.bookmarks || {}
          bookmarks[data.url] = data
          storage.set({ bookmarks }).then(function () {
            resolve({ action: 'saved' })
          })
        })
      } else {
        reject(new Error('NOT_SUPPORTED'))
      }
    })
  }
)
