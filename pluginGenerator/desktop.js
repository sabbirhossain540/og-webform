(function(PLUGIN_ID) {
    'use strict';

    // Load FontAwesome
    const fontAwesome = document.createElement('link');
    fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css";
    fontAwesome.rel = "stylesheet";
    document.head.appendChild(fontAwesome);

    // get plugin configuration settings
    const config = kintone.plugin.app.getConfig(PLUGIN_ID);

    const configData = {
        searchPluginStatus: config.searchPluginStatus,
        sectionsDataJSON: config.sectionsDataJSON
    };

    const emailConfigureData = JSON.parse(configData.sectionsDataJSON);

    //Spinner Design
    // Define your colors
    const colors = ['#0099cc', '#6600ff', '#cc0099', '#ff3300', '#ff9900', '#ff9900', '#669900', '#00cc99', '#333300', '#cc3300', '#666633', '#0000cc', '#9900ff', '#00ffcc', '#ff33cc'];

    // Function to get a random color
    function getRandomColor(colors) {
        const randomIndex = Math.floor(Math.random() * colors.length);
        return colors[randomIndex];
    }

    // When generating the spinner element
    const spinnerColor = getRandomColor(colors);

    const spinnerHtml = `
    <div class="spinner-border" role="status" style="color: ${spinnerColor};">
        <span class="sr-only">Loading...</span>
    </div>
    `;

    //

    var actions;
    var states;
    var users = {};
    var currentUser = kintone.getLoginUser();
    var ogusuSearchPluginCheck = config.searchPluginStatus;
    let firstIndexAction;

    //console.log(ogusuSearchPluginCheck);

    // Function to fetch process management status
    async function fetchProcessManagementStatus() {
        const body = {
            app: kintone.app.getId()
        };

        try {
            const response = await kintone.api(kintone.api.url('/k/v1/app/status.json', true), 'GET', body);
            return response;
        } catch (error) {
            console.error('Error fetching process management status:', error);
            throw error;
        }
    }

    
  

    // MQTT Function
    const sendmqtt = {
        connectHQTT: (topic,obj) => {
            return new Promise((resolve, reject) => {
                var script = document.createElement('script');
                script.src = 'https://unpkg.com/mqtt/dist/mqtt.min.js';
                script.onload = function() {
                    var client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');
                    client.on('connect', function () {
                        //console.log('Connected to MQTT broker');
                        //console.log(JSON.stringify(obj));
                        client.publish(topic, JSON.stringify(obj));
                    });
                    client.on('message', (topic, message) => {
                        //console.log(`Received message on topic ${topic}: ${message}`);
                        if (topic === 'kintone/balkapploval/mailer') {
                            client.end();
                            resolve('success');
                        }
                    });
                    client.subscribe('kintone/balkapploval/mailer');
                    client.on('error', function (error) {
                        console.error('Connection error: ', error);
                        reject(error);
                    });
                };
                document.head.appendChild(script);
            });
        }
    };

    function findRecordById(dataId, records) {
        return records.find(record => record.$id.value === dataId);
    }
    
    //Bulk Approval Function
    //Bulk Approval Function
    // function bulkApprovalFunction(buttonId, event){
    //     buttonId.className = 'btn btn-danger mr-1 mb-3 ml-3';
    //     buttonId.innerHTML = '<i class="fas fa-check-circle mr-1"></i> 一括承認！';
    //     buttonId.addEventListener('click', () => {
    //         //console.log(actions);
    //         var currentUser = kintone.getLoginUser();
    //         let selectedRecords = [];
    //         var enableActions;
    //         var approval_action = {};
    //         var approval_assignee = {};
    //         var  asigneeType;
    //         var allSelectedAction = [];
    //         var allSelectedUser = [];

    //         var checkboxes = document.querySelectorAll('.record-checkbox');
            
    //         for (const [index, checkbox] of checkboxes.entries()) {
    //             if (checkbox.checked) {
                    
    //                 const dataId = checkbox.getAttribute('data-id');
    //                 var record = findRecordById(dataId, event.records);
    //                 //console.log(record);
    //                 if (record) {
    //                     const selectedAction = document.getElementById(`dropdown-${record.$id.value}`).value;
    //                     const selectedUser = document.getElementById(`dropdowns-${record.$id.value}`).value;



    //                     if (!record.作業者.value.some(item => item.name === currentUser.name)) {
    //                         swal({
    //                             title: 'このアイテムを選択することは許可されていません。',
    //                             icon: 'warning',
    //                             buttons: true,
    //                             dangerMode: true,
    //                         }).then((willProceed) => {
    //                             if (!willProceed) {
    //                                 return;
    //                             }
    //                         });
    //                         return;
    //                     } else {
                            
    //                         selectedRecords.push(record);
    //                         allSelectedAction.push(selectedAction);
    //                         allSelectedUser.push(selectedUser);
    //                         enableActions = actions.filter(item => item.name === selectedAction);
    //                         //console.log(enableActions);
                            
    //                         enableActions.some(action => {

    //                             if (!approval_action[action.from]) {
    //                                 approval_action[action.from] = [];
    //                             }
    //                             if (!approval_assignee[action.from]) {
    //                                 approval_assignee[action.from] = [];
    //                             }


    //                             if (action.filterCond) {
    //                                 let result = parseFiltercond(action.filterCond.replace(/"/g, ''), record);
                                    

    //                                 if (result) {
    //                                     approval_action[action.from].push(action.name);
    //                                     const state = states[action.to]; // Get the state of the target status

    //                                     const assignees = getCurrentAssignee(state, record); // Get current assignees based on the state
    //                                     asigneeType = state.assignee.type;
                                        
    //                                     // if(state.assignee.type == 'ONE'){
    //                                     //     asigneeType = state.assignee.type;
    //                                     // }
    //                                     //console.log(state);
                                        


    //                                     if (assignees.length > 0) {
    //                                         approval_assignee[action.from].push(assignees[0].code);
    //                                     } else {
    //                                         approval_assignee[action.from].push(currentUser.code);
    //                                     }
    //                                 }
    //                             } else {
    //                                 approval_action[action.from].push(action.name);
    //                                 approval_assignee[action.from].push(currentUser.code);
    //                             }
    //                         });
    //                     }
    //                 } else {
    //                     console.log("Record not found");
    //                 }

                    
    //             }
    //         }

            
    //         // Ensure approval_action and approval_assignee are not empty
    //         Object.keys(approval_action).forEach(key => {
    //             if (approval_action[key].length === 0) {
    //                 delete approval_action[key];
    //                 delete approval_assignee[key];
    //             }
    //         });

    //         if (selectedRecords.length > 0) {
    //             if (approval_action) {
    //                 swal({
    //                     title: 'すべてを承認してもよろしいですか？',
    //                     text: '表示されているすべてのレコードを承認します',
    //                     icon: 'warning',
    //                     buttons: {
    //                         cancel: 'キャンセル',
    //                         confirm: {
    //                             text: '承認',
    //                             value: true,
    //                             visible: true,
    //                             className: 'btn btn-danger',
    //                             closeModal: false
    //                         }
    //                     }
    //                 }).then((willApprove) => {
    //                     if (willApprove) {
    //                         swal({
    //                             title: '処理中...',
    //                             text: 'レコードを更新中ですので、しばらくお待ちください。',
    //                             buttons: false, 
    //                             closeOnClickOutside: false,
    //                             content: {
    //                                 element: "div",
    //                                 attributes: {
    //                                     innerHTML: spinnerHtml
    //                                 }
    //                             }
    //                         });

    //                         // console.log(allSelectedAction);
    //                         const recordsToApprove = recordSerilizerWithAsignee(selectedRecords, allSelectedAction, asigneeType, allSelectedUser);
                           
    //                         //return;
    //                         const requestObj = {
    //                             app: kintone.app.getId(),
    //                             records: recordsToApprove
    //                         };

    //                         kintone.api(kintone.api.url('/k/v1/records/status.json', true), 'PUT', requestObj, async(resp) => {

    //                             try {
                                
    //                                 // Using async/await to send emails in parallel
    //                                 const sendAllEmails = async (records) => {
    //                                     const results = await Promise.all(records.map(record => sendEmailHandaler(record)));
    //                                     console.log("All email results:", results);
    //                                 };
                                
    //                                 // Call the function to send all emails
    //                                 sendAllEmails(resp.records);
                                
    //                                 // Replace swal.fire() with swal() for SweetAlert v1
    //                                 swal("承認に成功しました！", "お疲れ様でした。", "success").then(() => {
    //                                     location.reload();
    //                                 });
                                
    //                             } catch (error) {
    //                                 console.error('エラーが発生しました:', error);
                                
    //                                 // Use swal() for SweetAlert v1
    //                                 swal("エラーが発生しました", error.message, "error");
    //                             }
                                
                                                          
    //                         }, (error) => {
    //                             console.error('エラーが発生しました:', error);
    //                             swal.fire({
    //                                 title: 'エラーが発生しました',
    //                                 text: error.message,
    //                                 icon: 'error'
    //                             });
    //                         });
 
    //                     }
    //                 });
    //             } else {
    //                 swal({
    //                     title: '実行可能なアクションがありません。',
    //                     icon: 'warning'
    //                 });
    //             }
    //         } else {
    //             swal({
    //                 title: 'レコードを選択してください。',
    //                 icon: 'warning'
    //             });
    //         }
    //     });
    // }

    function bulkApprovalFunction(buttonId, event){
        buttonId.className = 'btn btn-danger mr-1 mb-3 ml-3';
        buttonId.innerHTML = '<i class="fas fa-check-circle mr-1"></i> 一括承認！';
        buttonId.addEventListener('click', () => {
            //console.log(actions);
            var currentUser = kintone.getLoginUser();
            let selectedRecords = [];
            var enableActions;
            var approval_action = {};
            var approval_assignee = {};
            var  asigneeType;
            var allSelectedAction = [];
            var allSelectedUser = [];

            //var checkboxes = document.querySelectorAll('.record-checkbox');
            let checkboxes = document.querySelectorAll('input.record-checkbox');
            

            // Convert NodeList to Array, then filter
            const filtered = Array.from(checkboxes).filter(el =>
                el.id.startsWith('checkbox-') && el.classList.contains('record-checkbox')
            );

            if(ogusuSearchPluginCheck == 1){
                checkboxes = filtered;
            }

            
            for (const [index, checkbox] of checkboxes.entries()) {

                if (checkbox.checked) {
                    
                    const dataId = checkbox.getAttribute('data-id');
                    var record = findRecordById(dataId, event.records);
                    //console.log(record);
                    if (record) {
                        const selectedAction = document.getElementById(`dropdown-${record.$id.value}`).value;
                        //const selectedUser = document.getElementById(`dropdowns-${record.$id.value}`).value;
                        const selectedUser = '';



                        if (!record.作業者.value.some(item => item.name === currentUser.name)) {
                            swal({
                                title: 'このアイテムを選択することは許可されていません。',
                                icon: 'warning',
                                buttons: true,
                                dangerMode: true,
                            }).then((willProceed) => {
                                if (!willProceed) {
                                    return;
                                }
                            });
                            return;
                        } else {
                            
                            selectedRecords.push(record);
                            allSelectedAction.push(selectedAction);
                            allSelectedUser.push(selectedUser);
                            enableActions = actions.filter(item => item.name === selectedAction);
                            
                            enableActions.some(action => {

                                if (!approval_action[action.from]) {
                                    approval_action[action.from] = [];
                                }
                                if (!approval_assignee[action.from]) {
                                    approval_assignee[action.from] = [];
                                }


                                if (action.filterCond) {
                                    let result = parseFiltercond(action.filterCond.replace(/"/g, ''), record);
                                    

                                    if (result) {
                                        approval_action[action.from].push(action.name);
                                        const state = states[action.to]; // Get the state of the target status

                                        const assignees = getCurrentAssignee(state, record); // Get current assignees based on the state
                                        asigneeType = state.assignee.type;
                                        
                                        // if(state.assignee.type == 'ONE'){
                                        //     asigneeType = state.assignee.type;
                                        // }
                                        //console.log(state);
                                        


                                        if (assignees.length > 0) {
                                            approval_assignee[action.from].push(assignees[0].code);
                                        } else {
                                            approval_assignee[action.from].push(currentUser.code);
                                        }
                                    }
                                } else {
                                    approval_action[action.from].push(action.name);
                                    approval_assignee[action.from].push(currentUser.code);
                                }
                            });
                        }
                    } else {
                        console.log("Record not found");
                    }

                    
                }
            }

            
            // Ensure approval_action and approval_assignee are not empty
            Object.keys(approval_action).forEach(key => {
                if (approval_action[key].length === 0) {
                    delete approval_action[key];
                    delete approval_assignee[key];
                }
            });

            if (selectedRecords.length > 0) {
                if (approval_action) {
                    swal({
                        title: 'すべてを承認してもよろしいですか？',
                        text: '表示されているすべてのレコードを承認します',
                        icon: 'warning',
                        buttons: {
                            cancel: 'キャンセル',
                            confirm: {
                                text: '承認',
                                value: true,
                                visible: true,
                                className: 'btn btn-danger',
                                closeModal: false
                            }
                        }
                    }).then((willApprove) => {
                        if (willApprove) {
                            swal({
                                title: '処理中...',
                                text: 'レコードを更新中ですので、しばらくお待ちください。',
                                buttons: false, 
                                closeOnClickOutside: false,
                                content: {
                                    element: "div",
                                    attributes: {
                                        innerHTML: spinnerHtml
                                    }
                                }
                            });

                            // console.log(allSelectedAction);
                            const recordsToApprove = recordSerilizerWithAsignee(selectedRecords, allSelectedAction, asigneeType, allSelectedUser);
                           
                            //return;
                            const requestObj = {
                                app: kintone.app.getId(),
                                records: recordsToApprove
                            };

                            kintone.api(kintone.api.url('/k/v1/records/status.json', true), 'PUT', requestObj, async(resp) => {

                                try {
                                
                                    // Using async/await to send emails in parallel
                                    const sendAllEmails = async (records) => {
                                        const results = await Promise.all(records.map(record => sendEmailHandaler(record)));
                                        console.log("All email results:", results);
                                    };
                                
                                    // Call the function to send all emails
                                    sendAllEmails(resp.records);
                                
                                    // Replace swal.fire() with swal() for SweetAlert v1
                                    swal("承認に成功しました！", "お疲れ様でした。", "success").then(() => {
                                        location.reload();
                                    });
                                
                                } catch (error) {
                                    console.error('エラーが発生しました:', error);
                                
                                    // Use swal() for SweetAlert v1
                                    swal("エラーが発生しました", error.message, "error");
                                }
                                
                                                          
                            }, (error) => {
                                console.error('エラーが発生しました:', error);
                                swal.fire({
                                    title: 'エラーが発生しました',
                                    text: error.message,
                                    icon: 'error'
                                });
                            });
 
                        }
                    });
                } else {
                    swal({
                        title: '実行可能なアクションがありません。',
                        icon: 'warning'
                    });
                }
            } else {
                swal({
                    title: 'レコードを選択してください。',
                    icon: 'warning'
                });
            }
        });
    }
    

    async function emailFormatter(record) {
        const body = {
            app: kintone.app.getId(),
            id: record.id
        };
    
        try {
            const resp = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', body);
            const status = resp.record["ステータス"].value;
            const emailAddress = resp.record["メールアドレス"].value;
    
            if (emailAddress !== '') {
                const emailConfig = emailConfigureData.find(config => config.status === status);
                if (!emailConfig) {
                    return { title: "", body: "", emailAddress: "" };
                }
    
                const fieldsToGet = emailConfig.multiFields.split(',').map(f => f.trim());
    
                const matchedFieldValues = {};
                fieldsToGet.forEach(fieldName => {
                    matchedFieldValues[fieldName] = resp.record[fieldName]?.value ?? "";
                });
    
                // Convert emailBody and footer to HTML-safe <br> format
                const mainBodyText = htmlToPlainText(emailConfig.emailBody).replace(/\n/g, '<br>');
                const footerText = htmlToPlainText(emailConfig.emailFooter).replace(/\n/g, '<br>');
    
                // Special field formatting
                const specialKey = ' 円';
                const specialFieldNames = ['報奨金', '改善効果金額'];
    
                // Build HTML email body
                let emailBody = "";
                emailBody += `<br>${mainBodyText}<br>`; 

                if(fieldsToGet != ''){
                    fieldsToGet.forEach(field => {
                        let plainTextValue = htmlToPlainText(matchedFieldValues[field]).replace(/\n/g, '<br>');
        
                        // If the field is a special one, add the "円" symbol
                        const suffix = specialFieldNames.includes(field) ? specialKey : "";
        
                        emailBody += `<br>[${field}] : ${plainTextValue}${suffix}`;
                    });

                }
    
                emailBody += `<br>${footerText}`;
    
                return {
                    title: emailConfig.emailTitle,
                    body: emailBody,
                    emailAddress: emailAddress,
                };
            } else {
                return { title: "", body: "", emailAddress: "" };
            }
    
        } catch (error) {
            return { title: "", body: "", emailAddress: "" };
        }
    }
    
    
    
    function htmlToPlainText(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return tempDiv.textContent || tempDiv.innerText || '';
    }


    async function sendEmailHandaler(getRecord) {
        let appName = await getAppDetails();
        var emailDetails = await emailFormatter(getRecord);
    
        if (emailDetails.body !== '' || emailDetails.title !== '') {
            //const apiGatewayUrl = 'https://kj983waqz3.execute-api.us-east-1.amazonaws.com/dev/smtp';
            const apiGatewayUrl = 'https://x7jkx69y1c.execute-api.us-east-1.amazonaws.com/default/ogusuEmailApi-dev-hello';
    
            const postData = {
                title: appName.trim() + " - " + emailDetails.title.trim(),
                messageBody: emailDetails.body,
                receiver: emailDetails.emailAddress
            };
    
            try {
                const response = await fetch(apiGatewayUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
    
                if (!response.ok) {
                    throw new Error('HTTP error, status = ' + response.status);
                }
    
                const responseData = await response.json();
                return {
                    status: 200,
                    message: 'Email sent successfully',
                    response: responseData
                };
            } catch (error) {
                console.error('Error sending email:', error);
                return {
                    status: 500,
                    message: 'Failed to send email',
                    error: error.message
                };
            }
        } else {
            return {
                status: 200,
                message: 'No email sent. Empty title or body.'
            };
        }
    }
    

    async function getAppDetails() {
        const body = {
            'id': kintone.app.getId()
        };
    
        return new Promise((resolve, reject) => {
            kintone.api(kintone.api.url('/k/v1/app.json', true), 'GET', body, function(resp) {
                resolve(resp.name);
            }, function(error) {
                console.error(error);
                reject(error);
            });
        });
    }
    
    function recordSerilizerWithAsignee(selectedRecords, allSelectedAction, asigneeType, allSelectedUser){
        const recordsToApprove = []; 
        
        selectedRecords.forEach((record, index) => {
            const action = {
                id: record.$id.value,
                action: allSelectedAction[index]
            };

            //console.log(asigneeType);

            if (asigneeType == "ONE") {
                var key = index;
                var currentStatus = record.ステータス.value;
                var destination;
                var currentAssigneeType;
                var lastIndexCheck = 0;

                // Convert object to array of key-value pairs
                const actionsEntries = Object.entries(actions);
                const foundAction = actionsEntries.find(([key, rec]) => rec.name === allSelectedAction[index] && rec.from === currentStatus);

                if (foundAction) {
                    const [key, rec] = foundAction;
                    destination = rec.to;
                }

                //console.log(states);
                const statesEntries = Object.entries(states);
                //console.log(rec);
                var foundEntry = statesEntries.find(([key, rec]) => rec.name === destination);

                if (foundEntry) {
                    const [key, rec] = foundEntry;
                    currentAssigneeType = rec.assignee.type;
                }

                // Initialize variables to track the element with the highest index
                var lastStatusName = getLastStatusName(statesEntries);

                // console.log('Name of the element with the highest index:', lastStatusName);
                if (lastStatusName === destination) {
                    lastIndexCheck = 1;
                }

                //console.log(lastIndexCheck);

                if (currentAssigneeType != 'ALL' && lastIndexCheck == 0) {
                    //New Code (31/01/2025)
                    // const expectedUser = foundEntry[1].assignee.entities[0].entity.code;
                    // if (expectedUser) {
                    //     //const assignee = expectedUser.value[0].code;
                    //     const assignee = 'testu3';
                    //     //action.assignee = assignee;
                    // } else {
                    //     console.error('Key does not exist in approval_assignee:', currentStatus, key);
                    // }

                    //Old Code
                    const appId = kintone.app.getId();
                    if(appId == '669'){
                        if(foundEntry[1].assignee.entities.length == 1){
                            const expectedUser = record[foundEntry[1].assignee.entities[0].entity.code];
                            //console.log(expectedUser);
    
                            if (expectedUser.value[0].code) {
                                const assignee = expectedUser.value[0].code;
                                action.assignee = assignee;
                            } else {
                                console.error('Key does not exist in approval_assignee:', currentStatus, key);
                            }
                        }
                    }

                }
            }else{
                var nextStatus;
                
                const nextActionData = actionFinder(actions, action.action, record);
                //console.log(nextActionData);
                if (nextActionData) {
                    nextStatus = nextActionData[1].to;
                }

                var nextStates = statesFinder(states, nextStatus);

                //console.log(nextStates);

                if(nextStates){
                    var statusAssigneeType = nextStates[1].assignee.type;
                    if(statusAssigneeType == 'ONE' && nextStates[1].assignee.entities != ''){
                        const appId = kintone.app.getId();
                        if(appId == '669'){
                            const nextStat = nextStates[1].assignee.entities[0].entity.code;
                            //console.log(nextStat);
                            const approvalValue = record[nextStat]?.value;
                            if(approvalValue == undefined){
                                action.assignee = nextStat;
                            }else{
                                action.assignee = approvalValue[0].code;
                            }   
                        }else{
                            action.assignee = nextStates[1].assignee.entities[0].entity.code;
                        }
                        
                    }

                    // if(statusAssigneeType == 'ANY' && nextStates[1].assignee.entities != ''){
                    //     action.assignee = allSelectedUser[index];
                    // }
                }
            }
            
            recordsToApprove.push(action);
        });

        //console.log(recordsToApprove);
        return recordsToApprove;
    }


    // function recordSerilizerWithAsignee(selectedRecords, allSelectedAction, asigneeType, allSelectedUser){
    //     const recordsToApprove = []; 
        
    //     selectedRecords.forEach((record, index) => {
    //         const action = {
    //             id: record.$id.value,
    //             action: allSelectedAction[index]
    //         };

    //         if (asigneeType == "ONE") {
    //             var key = index;
    //             var currentStatus = record.ステータス.value;
    //             var destination;
    //             var currentAssigneeType;
    //             var lastIndexCheck = 0;

    //             // Convert object to array of key-value pairs
    //             const actionsEntries = Object.entries(actions);
    //             const foundAction = actionsEntries.find(([key, rec]) => rec.name === allSelectedAction[index] && rec.from === currentStatus);

    //             if (foundAction) {
    //                 const [key, rec] = foundAction;
    //                 destination = rec.to;
    //             }

    //             //console.log(states);
    //             const statesEntries = Object.entries(states);
    //             //console.log(rec);
    //             var foundEntry = statesEntries.find(([key, rec]) => rec.name === destination);

    //             if (foundEntry) {
    //                 const [key, rec] = foundEntry;
    //                 currentAssigneeType = rec.assignee.type;
    //             }

    //             // Initialize variables to track the element with the highest index
    //             var lastStatusName = getLastStatusName(statesEntries);

    //             // console.log('Name of the element with the highest index:', lastStatusName);
    //             if (lastStatusName === destination) {
    //                 lastIndexCheck = 1;
    //             }

    //             // if (currentAssigneeType != 'ALL' && lastIndexCheck == 0) {
    //             //     //New Code (31/01/2025)
    //             //     const expectedUser = foundEntry[1].assignee.entities[0].entity.code;
    //             //     if (expectedUser) {
    //             //         //const assignee = expectedUser.value[0].code;
    //             //         const assignee = 'testu3';
    //             //         //action.assignee = assignee;
    //             //     } else {
    //             //         console.error('Key does not exist in approval_assignee:', currentStatus, key);
    //             //     }

    //             //     //Old Code
    //             //     // const expectedUser = record[foundEntry[1].assignee.entities[0].entity.code];

    //             //     // if (expectedUser.value[0].code) {
    //             //     //     const assignee = expectedUser.value[0].code;
    //             //     //     action.assignee = assignee;
    //             //     // } else {
    //             //     //     console.error('Key does not exist in approval_assignee:', currentStatus, key);
    //             //     // }

    //             // }
    //         }else{
    //             var nextStatus;
                
    //             const nextActionData = actionFinder(actions, action.action, record);
    //             if (nextActionData) {
    //                 nextStatus = nextActionData[1].to;
    //             }

    //             var nextStates = statesFinder(states, nextStatus);
    //             if(nextStates){
    //                 var statusAssigneeType = nextStates[1].assignee.type;

    //                 if(statusAssigneeType == 'ONE' && nextStates[1].assignee.entities != ''){
    //                     action.assignee = nextStates[1].assignee.entities[0].entity.code;
    //                 }

    //                 // if(statusAssigneeType == 'ANY' && nextStates[1].assignee.entities != ''){
    //                 //     action.assignee = allSelectedUser[index];
    //                 // }
    //             }
    //         }
            
    //         recordsToApprove.push(action);
    //     });

    //     return recordsToApprove;
    // }

    function actionFinder(allAction, current, record){
        const actionsEntries = Object.entries(allAction);
        const foundAction = actionsEntries.find(([key, rec]) => rec.name === current && rec.from === record.ステータス.value);
        return foundAction;
    }

    function statesFinder(allStatus, current){
        const statesEntries = Object.entries(allStatus);
        var foundEntry = statesEntries.find(([key, rec]) => rec.name === current);
        return foundEntry;
    }

    function getLastStatusName(allStatus) {
        // Initialize variables to track the element with the highest index
        let maxIndex = -1;
        let maxIndexElement = null;

        // Iterate through the array to find the element with the highest index
        allStatus.forEach(([key, rec]) => {
            const index = parseInt(rec.index, 10); // Ensure the index is an integer
            if (index > maxIndex) {
                maxIndex = index;
                maxIndexElement = rec;
            }
        });

        // Extract the name of the element with the highest index
        const lastIndexName = maxIndexElement ? maxIndexElement.name : null;
        return lastIndexName;
    }


    // For all item selection use this function
    function allItemSelect(buttonId, event){
        buttonId.className = 'btn btn-warning mb-3 ml-1';
        buttonId.innerHTML = '<i class="fas fa-check-double mr-1"></i>  全選択';
        buttonId.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.record-checkbox');
        
        checkboxes.forEach(checkbox => {
                // Create a dropdown for each checkbox
                const dataId = checkbox.getAttribute('data-id');
                let dropdown = document.createElement('select');
                dropdown.className = 'row-dropdown';
                dropdown.id = `dropdown-${dataId}`
                dropdown.style.display = 'none'; 

                let dropdowns = document.createElement('select');
                dropdowns.className = 'row-dropdown';
                dropdowns.id = `dropdowns-${dataId}`
                dropdowns.style.display = 'none'; 

                // Insert the checkbox and dropdown into the first cell of the row
                const row = checkbox.closest('tr');
                const firstCell = row.querySelector('td');

                if (firstCell) {
                    firstCell.innerHTML = '';
                    firstCell.appendChild(checkbox);
                    firstCell.appendChild(dropdown);
                    firstCell.appendChild(dropdowns);
                    
                } else {
                    const newFirstCell = row.insertCell(0);
                    newFirstCell.appendChild(checkbox);
                    newFirstCell.appendChild(dropdown);
                    newFirstCell.appendChild(dropdowns);
                }
                
                dropDownColumnGenerator();

                const dataStatus = checkbox.getAttribute('data-status');
                const record = event.records.find(record => record.$id.value === dataId);
            
                // Event listener to show dropdown when checkbox is checked
                checkbox.addEventListener('change', function() {
                    if (checkbox.checked) {
                        fetchActions(dropdown, record, dataStatus).then(() => {
                            dropdown.style.display = 'inline-block';
                            //dropdowns.style.display = 'inline-block';
                        });
                        
                    } else {
                        dropdown.style.display = 'none';
                        dropdowns.style.display = 'none';
                    }
                });
            
                // Programmatically check all checkboxes (for testing or specific use cases)
                checkbox.checked = true;

                fetchActions(dropdown, record, dataStatus).then(() => {
                    dropdown.style.display = 'inline-block';
                    dropdown.className = 'row-dropdown form-control-sm';
                });

                // fetchUsersForAction(dropdowns, record, record.ステータス.value, firstIndexAction).then(() => {
                //     dropDownColumnGenerator();
                //     dropdowns.style.display = 'inline-block';
                //     dropdowns.className = 'row-dropdown form-control-sm';
                // });
            });

        });
    }

    //For all item deselect use this function
    function allItemDeselect(buttonId){
        buttonId.className = 'btn btn-info mb-3 ml-2';
        buttonId.innerHTML = '<i class="fas fa-undo mr-1"></i>  すべて選択解除';

        buttonId.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.record-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                let dataId = checkbox.getAttribute('data-id');
                document.getElementById(`dropdown-${dataId}`).style.display = 'none';
                document.getElementById(`dropdowns-${dataId}`).style.display = 'none';
            });
        });
    }

    const addButtons = (event) => {
        const el = kintone.app.getHeaderSpaceElement();
        // 既存のheader-contentsをクリア
        const existingHeader = el.querySelector('.header-contents');
        if (existingHeader) {
            existingHeader.remove();
        }

        const headerDiv = document.createElement('div');
        headerDiv.className = 'header-contents d-flex align-items-center text-center';

        const balkApprovalButton = document.createElement('button');
        bulkApprovalFunction(balkApprovalButton, event);

        const selectAllButton = document.createElement('button');
        allItemSelect(selectAllButton, event);

        // For Deselect
        const deSelectAllButton = document.createElement('button');
        allItemDeselect(deSelectAllButton);

        headerDiv.appendChild(balkApprovalButton);
        headerDiv.appendChild(selectAllButton);
        headerDiv.appendChild(deSelectAllButton);
        el.appendChild(headerDiv);
    };

    kintone.events.on('app.record.index.show', async function(event) {
        // Check if the element with ID 'krewsheet' exists
        var krewsheetElementCheck = document.getElementById('krewsheet');
        if (krewsheetElementCheck) {
            return;
        }

        let processStatus;
    
        try {
            processStatus = await fetchProcessManagementStatus();
            // Store the status in a variable for further use
            window.processStatus = processStatus.actions;
    
            states = processStatus.states;
            const starts = Object.values(states).find(state => state.index === "0")?.name;
            const excludedNames = new Set(processStatus.actions
                .filter(action => action.to === starts)
                .map(action => action.name));
            actions = processStatus.actions.filter(action => !excludedNames.has(action.name));
    
            actions.forEach(action => {
                const conditions = action.filterCond.replace(/\(|\)|"/g, '').split(/and | or /);
                conditions.forEach(condition => {
                    if (condition) {
                        const targets = condition.split(/not in | in /)[1].split(',');
                        const isMenber = ["GROUP", "ORGANIZATION", "USER"].some(item => condition.includes(item));
                        if (isMenber) {
                            const groups = [];
                            for (let i = 0; i < targets.length; i += 2) {
                                groups.push(targets.slice(i, i + 2));
                            }
                            
                            fetchGroupUsers(groups);
                        }
                    }
                });
            });
    
        } catch (error) {
            console.error('Failed to fetch process management status:', error);
        }


        await searchPluginCheck(event);
        // console.log("From ======");
        // console.log(searchPluginExist);
        
        // if(searchPluginExist == false){
        //     await initializeCheckboxes(event.records);
        // }
        
        
        addButtons(event);
    });

    async function searchPluginCheck(event){
        if(ogusuSearchPluginCheck){
            if(ogusuSearchPluginCheck == 2){
                initializeCheckboxes(event.records);
            }else{
                if(ogusuSearchPluginCheck != 1){
                        setTimeout(() => {
                        dataTableCheckBoxInitializer(event.records);
                    }, 1000); // Delay of 3 seconds

                }
                
            }

        }
    }

    
    //Test Parpose
    // function dataTableCheckBoxInitializer(records) {
    //     // Get the table once
    //     let table = document.getElementById('ogusuSearch');
    //     if (!table) {
    //         console.error('Table "ogusuSearch" not found.');
    //         return;
    //     }

    //     // Add header cell if it doesn't exist
    //     let thead = table.querySelector('thead');
    //     if (thead) {
    //         let headerRow = thead.querySelector('tr');
    //         if (headerRow && !headerRow.querySelector('.custom-header-cell')) {
    //             let newHeaderCell = document.createElement('th');
    //             newHeaderCell.className = 'recordlist-header-cell-gaia custom-header-cell';
    //             newHeaderCell.textContent = '選択'; // "Selection" in Japanese
    //             headerRow.insertBefore(newHeaderCell, headerRow.firstChild);
    //         }
    //     }
    
    //     // Get tbody and rows once
    //     let tbody = table.querySelector('tbody');
    //     let rows = tbody.querySelectorAll('tr');
        
    //     // Get current user name (replace with actual Kintone user retrieval)
    //     let currentUserName = currentUser.name;

    //     // Process each row only once
    //     rows.forEach(row => {
    //         // Check if the row already has our custom cell to avoid duplicate processing
    //         if (row.querySelector('.custom-checkbox-cell')) {
    //             return;
    //         }
    
    //         let recordNumberCell = row.querySelector('td:nth-child(2)');
    //         if (!recordNumberCell) return;

    //         let recordNumber = recordNumberCell.innerText.trim();

    //         // Find corresponding record from records array
    //         let record = records.find(rec => rec['レコード番号'].value.trim() === recordNumber);
    //         if (!record) return;
    //         let recordOperator = record['作業者'].value[0].name;
    //         let recordStatus = record.ステータス.value;

    //         // Create new cell with custom class
    //         let newCell = row.insertCell(0);
    //         newCell.className = 'recordlist-header-cell-gaia custom-checkbox-cell';
    
    //         // Only create controls if user matches operator and status isn't approved
    //         if (recordOperator === currentUserName && recordStatus !== '承認済') {
    //             // Create Checkbox
    //             let checkbox = document.createElement('input');
    //             checkbox.type = 'checkbox';
    //             checkbox.className = 'record-checkbox';
    //             checkbox.setAttribute('data-id', recordNumber);
    //             checkbox.setAttribute('data-status', recordStatus);
    
    //             // Create Dropdown
    //             let dropdown = document.createElement('select');
    //             dropdown.id = `dropdown-${recordNumber}`;
    //             dropdown.className = 'row-dropdown form-control-sm';
    //             dropdown.style.display = 'none';
    
    //             // Add elements to cell
    //             newCell.appendChild(checkbox);
    //             newCell.appendChild(dropdown);
    
    //             // Checkbox change event
    //             checkbox.addEventListener('change', function() {
    //                 if (checkbox.checked) {
    //                     fetchActions(dropdown, record, record.ステータス.value).then(() => {
    //                         dropdown.style.display = 'inline-block';
    //                     });
    //                 } else {
    //                     dropdown.style.display = 'none';
    //                 }
    //             });
    //         }
    //     });
    // }
    function dataTableCheckBoxInitializer(records) {
        // Get the table onc    e
        let table = document.getElementById('ogusuSearch');
        if (!table) {
            console.error('Table "ogusuSearch" not found.');
            return;
        }

        // Add header cell if it doesn't exist
        let thead = table.querySelector('thead');
        if (thead) {
            let headerRow = thead.querySelector('tr');
            if (headerRow && !headerRow.querySelector('.custom-header-cell')) {
                let newHeaderCell = document.createElement('th');
                newHeaderCell.className = 'recordlist-header-cell-gaia custom-header-cell';
                newHeaderCell.textContent = '選択'; // "Selection" in Japanese
                headerRow.insertBefore(newHeaderCell, headerRow.firstChild);
            }
        }
    
        // Get tbody and rows once
        let tbody = table.querySelector('tbody');
        let rows = tbody.querySelectorAll('tr');
        
        // Get current user name (replace with actual Kintone user retrieval)
        let currentUserName = currentUser.name;

        // Process each row only once
        rows.forEach(row => {
            // Check if the row already has our custom cell to avoid duplicate processing
            if (row.querySelector('.custom-checkbox-cell')) {
                return;
            }
    
            let recordNumberCell = row.querySelector('td:nth-child(2)');
            if (!recordNumberCell) return;

            let recordNumber = recordNumberCell.innerText.trim();

            // Find corresponding record from records array
            let record = records.find(rec => rec['レコード番号'].value.trim() === recordNumber);
            if (!record) return;
            let recordOperator = record['作業者'].value[0].name;
            let recordStatus = record.ステータス.value;

            // Create new cell with custom class
            let newCell = row.insertCell(0);
            newCell.className = 'recordlist-header-cell-gaia custom-checkbox-cell';
    
            // Only create controls if user matches operator and status isn't approved
            if (recordOperator === currentUserName && recordStatus !== '承認済') {
                // Create Checkbox
                let checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'record-checkbox';
                checkbox.setAttribute('data-id', recordNumber);
                checkbox.setAttribute('data-status', recordStatus);
    
                // Create Dropdown
                let dropdown = document.createElement('select');
                dropdown.id = `dropdown-${recordNumber}`;
                dropdown.className = 'row-dropdown form-control-sm';
                dropdown.style.display = 'none';
    
                // Add elements to cell
                newCell.appendChild(checkbox);
                newCell.appendChild(dropdown);
    
                // Checkbox change event
                checkbox.addEventListener('change', function() {
                    if (checkbox.checked) {
                        fetchActions(dropdown, record, record.ステータス.value).then(() => {
                            dropdown.style.display = 'inline-block';
                        });
                    } else {
                        dropdown.style.display = 'none';
                    }
                });
            }
        });
    }
    

    //End Test Parpose
    
    // Function to initialize checkboxes and dropdowns
    
    function initializeCheckboxes(records) {
        let rowElements = kintone.app.getFieldElements('レコード番号');
        let recordOperator;
    
        records.forEach(function(record) {
            let rowElement = Array.from(rowElements).find(el => el.textContent.trim() === record['レコード番号'].value.trim());

            if (rowElement) {
                if (!rowElement.closest('tr').querySelector(`.record-checkbox[data-id="${record.$id.value}"]`)) {
                    let checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'record-checkbox';
                    checkbox.setAttribute('data-id', record.$id.value);
                    checkbox.setAttribute('data-status', record.ステータス.value);
    
                    let dropdown = document.createElement('select');
                    dropdown.id = `dropdown-${record.$id.value}`;
                    dropdown.className = 'row-dropdown form-control-sm'; // Add Bootstrap class here
                    dropdown.style.display = 'none';

                    //Test Case
                    let dropdowns = document.createElement('select');
                    dropdowns.id = `dropdowns-${record.$id.value}`;
                    dropdowns.className = 'row-dropdown form-control-sm disabled'; // Add Bootstrap class here
                    dropdowns.style.display = 'none';

                    //End Test Case
    
                    let cell = rowElement.closest('tr').insertCell(0);
                    cell.className = 'recordlist-header-cell-gaia';

                    let allAssignee = [];
                    if(record['作業者'].value != ''){
                        var allAssinee = record['作業者'].value;
                        allAssinee.forEach((rec)=>{
                            allAssignee.push(rec.name)
                        });
                        recordOperator = record['作業者'].value[0].name;
                    }

                    dropDownColumnGenerator();

                    if(allAssignee.includes(currentUser.name) && record['ステータス'].value != '承認済'){
                        cell.appendChild(checkbox);
                        cell.appendChild(dropdown);
                        cell.appendChild(dropdowns);
                    }
                    
    
                    checkbox.addEventListener('change', function() {
                        if (checkbox.checked) {
                            fetchActions(dropdown, record, record.ステータス.value).then(() => {
                                dropDownColumnGenerator();
                                dropdown.style.display = 'inline-block';
                            });

                            // fetchUsersForAction(dropdowns, record, record.ステータス.value, firstIndexAction).then(() => {
                            //     dropDownColumnGenerator();
                            //     dropdowns.style.display = 'inline-block';
                            // });

                            

                            

                        } else {
                            dropdown.style.display = 'none';
                            dropdowns.style.display = 'none';
                        }
                    });

                    dropdown.addEventListener('change', function() {
                        console.log("ok");
                    });
                }
            } else {
                console.error(`Row element not found for record: ${record['レコード番号'].value}`);
            }
        });
    }

    //Newly Added
    function fetchGroupUsers(groups) {
        const userdata = {
            "GROUP": "/v1/group/users.json",
            "ORGANIZATION": "/v1/organization/users.json",
            "USER": '/v1/users.json'
        };

        groups.forEach(group => {
            const type = group[0].trim();
            const code = group[1].trim();
            const appId = kintone.app.getId();

            if (!users[type]) {
                users[type] = {};
            }

            if (!users[type][code]) {
                users[type][code] = [];
                const body = {
                    code: code,
                    codes: code,
                    app: appId
                };
                

                fetchUsers(userdata, type, body, code);
            }
        });
    }

    function fetchUsers(userdata, type, body, code) {
        let offset = 0;

        function fetchBatch(offset) {
            body.offset = offset;
            kintone.api(kintone.api.url(userdata[type], true), 'GET', body, (guser) => {
                const userKeys = Object.keys(guser);
                
                if (userKeys.length === 0 || guser[userKeys[0]].length === 0) {
                    console.log(`${type} ${body.code} has no more users.`);
                    return;
                }

                if (!users[type]) {
                    users[type] = {};
                }
                if (!users[type][code]) {
                    users[type][code] = [];
                }
                guser[userKeys[0]].forEach(data => {
                    if (!users[type][code].includes(data.code)) {
                        users[type][code].push(data.code);
                    }
                });

                if (guser[userKeys[0]].length === 100) {
                    fetchBatch(offset + 100);
                } 
                // else {
                //     console.log(type, body.code, guser);
                // }
            });
        }

        fetchBatch(offset);
    }

    function parseFiltercond(filterCond, data) {
        const resultArray = [];
        filterCond.replace(/ and | or /g, match => {
            resultArray.push(match.trim() === 'and' ? '&&' : '||');
        });
    
        const conds = filterCond.split(/ and | or /);
        let results = [];
    
        conds.forEach(cond => {
            const details = cond.split(/ not in | in /);
            const targets = details[1].replace(/\(|\)/g, '').split(",");
            const isMember = ["GROUP", "ORGANIZATION", "USER"].some(item => cond.includes(item));
    
            if (isMember) {
                const chunkedArray = [];
                for (let i = 0; i < targets.length; i += 2) {
                    chunkedArray.push(targets.slice(i, i + 2));
                }
    
                const isName = chunkedArray.some(target => {
                    const fieldName = details[0].trim();
                    const dataArray = data[fieldName]?.value;
    
                    // Handle both array and single object scenarios
                    if (Array.isArray(dataArray)) {
                        const targetGroup = target[0].trim();
                        const targetValue = target[1].trim();
                        const isCode = dataArray.some(code => users[targetGroup]?.[targetValue]?.includes(code.code));
    
                        return isCode;
                    } else if (typeof dataArray === 'object' && dataArray !== null) {
                        // Single-object fields like Creator
                        const targetGroup = target[0].trim();
                        const targetValue = target[1].trim();
                        const isCode = users[targetGroup]?.[targetValue]?.includes(dataArray.code);
    
                        return isCode;
                    }
    
                    console.error(`Expected array or object for field ${fieldName}, but got:`, dataArray);
                    return false;
                });
    
                results.push(isName ? !cond.includes("not in") : cond.includes("not in"));
            } else {
                const fieldValue = data[details[0].trim()]?.value;
                if (!fieldValue) {
                    console.error(`Field ${details[0].trim()} not found in data`);
                    results.push(false);
                    return;
                }
    
                results.push(details[1].includes(fieldValue) ? !cond.includes("not in") : cond.includes("not in"));
            }
        });

        
        if (results.length) {
            let result_string = results[0].toString();
            for (let i = 1; i < results.length; i++) {
                result_string += ` ${resultArray[i - 1]} ${results[i]}`;
            }

            return eval(result_string);
        } else {
            return false;
        }
    }
    
    function getCurrentAssignee(state, record) {
        const assignees = [];
        if (state.assignee && state.assignee.entities) {
            state.assignee.entities.forEach(entity => {
                if (entity.entity.type === "FIELD_ENTITY") {
                    const fieldCode = entity.entity.code;
                    const fieldAssignees = record[fieldCode]?.value;
                    
                    // Ensure that fieldAssignees is an array before using the spread syntax
                    if (Array.isArray(fieldAssignees)) {
                        assignees.push(...fieldAssignees);
                    } else if (typeof fieldAssignees === 'object' && fieldAssignees !== null) {
                        // Handle single-object fields like Creator
                        assignees.push(fieldAssignees);
                    } else {
                        console.error(`Expected array or object for field ${fieldCode}, but got:`, fieldAssignees);
                    }
                }
            });
        }
        return assignees;
    }

    function dropDownColumnGenerator(){
        const table = kintone.app.getFieldElements('ステータス')[0]?.closest('table');
        if (!table) {
            return;
        }

        let thead = table.querySelector('thead');

        if (!thead) {
            thead = document.createElement('thead');
            table.insertBefore(thead, table.firstChild);
        }

        let th = thead.querySelector('.adding-th');
        if (!th) {
            th = document.createElement('th');
            th.style.width = '150px';
            th.className = "recordlist-header-cell-gaia adding-th";
            th.textContent = "レコードの選択";
            thead.insertBefore(th,thead.firstChild);
        }
    }

    async function fetchActions(dropdown, record, status) {
        populateDropdown(dropdown, actions, status, record);
    }

    async function fetchUsersForAction(dropdown, record, status, firstAction){
        populateUserDropdown(dropdown, actions, status, record, firstAction);
    }

    function populateDropdown(dropdown, actions, status, record) {
        var collletedActions;
        var eligibleActionName = [];

        actions.forEach(action => {
            if (action.from === status) {
                 var approval_action2 = {};
                 collletedActions = actions.filter(item => item.name === action.name);
                 

                collletedActions.some(action => {
                    if (!approval_action2[action.from]) {
                        approval_action2[action.from] = [];
                    }

                    if(action.filterCond == ''){
                        approval_action2[action.from].push(action.name);
                    }
                    

                    if (action.filterCond) {
                        let result = parseFiltercond(action.filterCond.replace(/"/g, ''), record);
                    
                        if (result) {
                            approval_action2[action.from].push(action.name);
                        }
                    }
                });

                if (approval_action2[status]) { 
                    eligibleActionName.push(...approval_action2[status]); 
                }
            }
        });

        // Clear existing options
        dropdown.innerHTML = '';

        firstIndexAction = eligibleActionName[0]
        // Loop through eligibleActionNames and create option elements
        eligibleActionName.forEach(actionName => {
            let option = document.createElement('option');
            option.value = actionName;
            option.text = actionName;
            dropdown.appendChild(option);
        });
        
    }
   

    function populateUserDropdown(dropdown, actions, status, record, firstAction){

        var eligibleUserName = [];

        actions.forEach(action => {
            if (action.from === status && action.name === firstAction) {
                const approvalField = actualActionNameChecker(action.to);
                const approvalValue = record[approvalField]?.value;
                approvalValue.forEach(rec => {
                    eligibleUserName.push(rec);
                }); 
            }
        });

        // Clear existing options
        dropdown.innerHTML = '';

        // Loop through eligibleActionName and create option elements
        eligibleUserName.forEach(action => {
            let option = document.createElement('option');
            option.value = action.code; // Set 'code' as the dropdown value
            option.text = action.name;  // Set 'name' as the visible text
            dropdown.appendChild(option);
        });


    }

    function actualActionNameChecker(name){
        let approvalField = name; 
        const appId = kintone.app.getId();
        if(appId == '669'){
            switch (approvalField) {
                case '考課①':
                    approvalField = '考課者_1';
                    break;
                case '考課②':
                    approvalField = '考課者_2';
                    break;
                case '考課③':
                    approvalField = '考課者_3';
                    break;
                case '部長承認':
                    approvalField = '部長';
                    break;
                case '総務１承認':
                    approvalField = '総務１';
                    break;
                case '総務２承認':
                    approvalField = '総務２';
                    break;
                case '社長承認':
                    approvalField = '社長';
                    break;
            }
        }
        
        return approvalField;
    }

    



})(kintone.$PLUGIN_ID);