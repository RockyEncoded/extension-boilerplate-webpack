import ext from 'webextension-polyfill'

export default ext.storage.sync ? ext.storage.sync : ext.storage.local
