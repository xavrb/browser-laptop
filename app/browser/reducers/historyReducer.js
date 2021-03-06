/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const historyState = require('../../common/state/historyState')
const aboutHistoryState = require('../../common/state/aboutHistoryState')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const {STATE_SITES} = require('../../../js/constants/stateConstants')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const syncUtil = require('../../../js/state/syncUtil')
const filtering = require('../../filtering')
const {calculateTopSites} = require('../api/topSites')

const historyReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      {
        const defaults = state.get('clearBrowsingDataDefaults')
        const temp = state.get('tempClearBrowsingData', Immutable.Map())
        const clearData = defaults ? defaults.merge(temp) : temp
        if (clearData.get('browserHistory')) {
          state = historyState.clearSites(state)
          state = aboutHistoryState.clearHistory(state)
          filtering.clearHistory()
        }
        break
      }
    case appConstants.APP_ADD_HISTORY_SITE:
      {
        const detail = action.get('siteDetail', Immutable.Map())

        if (detail.isEmpty()) {
          break
        }

        if (Immutable.List.isList(detail)) {
          detail.forEach((item) => {
            state = historyState.addSite(state, item)
            state = syncUtil.updateObjectCache(state, item, STATE_SITES.HISTORY_SITES)
          })
        } else {
          state = historyState.addSite(state, detail)
          state = syncUtil.updateObjectCache(state, detail, STATE_SITES.HISTORY_SITES)
        }

        calculateTopSites(true)
        state = aboutHistoryState.setHistory(state, historyState.getSites(state))
        break
      }

    case appConstants.APP_REMOVE_HISTORY_SITE:
      {
        const historyKey = action.get('historyKey')
        if (historyKey == null) {
          break
        }

        if (Immutable.List.isList(historyKey)) {
          action.get('historyKey', Immutable.List()).forEach((key) => {
            state = historyState.removeSite(state, key)
            // TODO: Implement Sync history site removal
            // state = syncUtil.updateObjectCache(state, action.get('siteDetail'), STATE_SITES.HISTORY_SITES)
          })
        } else {
          state = historyState.removeSite(state, historyKey)
          // TODO: Implement Sync history site removal
          // state = syncUtil.updateObjectCache(state, action.get('siteDetail'), STATE_SITES.HISTORY_SITES)
        }

        calculateTopSites(true)
        state = aboutHistoryState.setHistory(state, historyState.getSites(state))
        break
      }

    case appConstants.APP_POPULATE_HISTORY:
      state = aboutHistoryState.setHistory(state, historyState.getSites(state))
      break
  }

  return state
}

module.exports = historyReducer
