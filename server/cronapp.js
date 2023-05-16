/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const request = require('request')
const moment = require('moment')
const helper = require('./helpers/cron-helper.js')

// async function fetchData(device_name, device_api_key, project, selection.valuesObj, user_id, selection.selection_elements) {
async function fetchData(device_api_key, cronArray, user_id) {
    try {
        const options = {
            method: 'POST',
            url: process.env.beeURL,
            qs: { apikey: device_api_key.trim() },
        }

        request(options, async function (error, response, body) {
            if (error) console.log(error)
            try {
                const jsonBody = JSON.parse(body)
                if (jsonBody.message) {
                    return false
                }

                for (const cronSelections of cronArray) {
                    for (const selection of cronSelections) {
                        console.log('in fetchData project', selection.project.id, 'device_name', selection.deviceID, device_api_key)
                        const obj = jsonBody.find((o) => o.bee_number == selection.deviceID)
                        if (obj) {
                            helper.saveDeviceLog(obj, selection.project, selection.deviceID)
                            helper.saveLocationLogs(obj, selection.project, selection.selection_elements)
                            helper.saveTemperatureLogs(obj, selection.project, selection.valuesObj, selection.selection_elements)
                            helper.saveHumidityLogs(obj, selection.project, selection.valuesObj, selection.selection_elements)
                            await helper.saveBorderInfo(obj, selection.project, user_id, selection.selection_elements)
                            await helper.generateSealingAlert(obj, selection.project, selection.valuesObj, user_id, selection.selection_elements)
                        }
                    }
                }

                console.log('##########################################################')
            } catch (e) {
                console.log('Error in fetch device -- ', e, body)
            }
        })
    } catch (error) {
        console.log(`Error in fetch device data cron: ${error}`)
    }
}

exports.fetchData = fetchData
