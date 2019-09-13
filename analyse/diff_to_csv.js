/**********************************************************
 * diffFP.js
 * Compares FP results based upon their IDs and outputs the differences
 *
 * License 2018 Open Source License
 * Written By: Gabry Vlot (https://github.com/GabryVlot)
 * Project: Detecting Web bot Detecting | Fingerprinting (https://github.com/GabryVlot/BrowserBasedBotFP)
 **********************************************************/

const dbUtils = require('../db/db-utils.js');
const readline = require('readline');
const consoleInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const skipFields = ['id', 'configuration_id', 'hash'];

let tableCounter = 0;
let closeCounter = 9;
let source_configId;
let target_configId;
let db;
let tableDeviations = [];
let show_details = true;

//Request the Source ID and Target ID as input from the end user to compare with each other
consoleInterface.question('Source FP ID: ', (answer) => {
    source_configId = answer;
    consoleInterface.question('Target FP ID: ', (answer) => {
        target_configId = answer;
        compare();
        consoleInterface.close();
    });
});

//Main entry compare function
const compare = function(){
    if (!source_configId || !target_configId)
        return;

    db = dbUtils.connect();
    //Compare source and target FP table records
    compareTable('fp', source_configId, target_configId);
    compareTable('js_fonts', source_configId, target_configId);
    compareTable('swf_fonts', source_configId, target_configId);
    compareTable('regular_plugins', source_configId, target_configId);
    compareTable('ie_plugins', source_configId, target_configId);
    compareTable('requests', source_configId, target_configId);
    compareTable('browser', source_configId, target_configId, {compareFields:['window_keys'], isJSON:false});
    compareTable('document', source_configId, target_configId, {compareFields:['document_keys'], isJSON:false});
    compareTable('navigator', source_configId, target_configId, {compareFields:['navigator'], isJSON:true});
};

//Compares sourceFP with targetFP record and lists the non matching fields
const compareTable = function(tableName, sourceId, targetId, compareObjectSpecification){
    readFromTable(tableName, sourceId, function(sourceRows){
        readFromTable(tableName, targetId, (targetRows) =>{
            const sourceRow = sourceRows[0];
            const targetRow = targetRows[0];
            //Check existence table (e.g. swf_fonts is not always initiated)
            if (!sourceRow && !targetRow)
                return finalize({"sourceID": sourceId, "targetID":targetId});

            compareRecord(tableName, sourceRow, targetRow, compareObjectSpecification)
            finalize();
        });
    })
}

const compareRecord = function(tableName, sourceRow, targetRow, compareObjectSpecification){
    //Compare hashes
    if (sourceRow.hash !== targetRow.hash) {
        tableDeviations[tableName] = {
            deviatingFields : [],
        };

        for (let field in sourceRow){
            if (skipFields.indexOf(field) > -1)
                continue;

            //Print deviating fields
            if (sourceRow[field] !== targetRow[field]){
                tableDeviations[tableName].deviatingFields.push(field);
            }
        }

        if (compareObjectSpecification){
            compareObjects(tableName, sourceRow, targetRow, compareObjectSpecification.compareFields, compareObjectSpecification.isJSON);
        }
    };
    return tableDeviations[tableName];
}

//Compares specified JSON object from source FP record with target Record
const compareObjects = function(tableName, sourceRow, targetRow, fields, isJSON){
    const splitter = ',';

    for (let i=0; i<fields.length; i++) {
        const field = fields[i];
        let sourceList;
        let targetList;
        let sourceObj;
        let targetObj;
        tableDeviations[tableName].deviatingObjects = [];

        //Format object for comparison
        if (isJSON){
            sourceObj = JSON.parse(sourceRow[field]);
            targetObj = JSON.parse(targetRow[field]);
            sourceList = getObjectProperties(sourceObj);
            targetList = getObjectProperties(targetObj);
        }
        else{
            sourceList = sourceRow[field].split(splitter);
            targetList = targetRow[field].split(splitter);
        }

        //Initializing deviation object
        const objectProperties = {
            missing : [],
            added : [],
            modified : [],
            sourceLength : sourceList.length,
            targetLength : targetList.length
        };

        for (let z=0;z<sourceList.length;z++){
            const key = sourceList[z];
            const targetIndex = targetList.indexOf(key);
            if (targetIndex === -1) {
                objectProperties.missing.push(key);
            }
            else if (isJSON)
            {
                const sourceValue = sourceObj[key] || '';
                const targetValue = targetObj[key] || '';
                if (sourceValue.toString() !== targetValue.toString() ){
                    objectProperties.modified.push(key);
                }
            }
        }

        for (let u=0;i<targetList.length;i++){
            const targetItem = targetList[u];
            if (sourceList.indexOf(targetItem) === -1)
                objectProperties.added.push(targetItem);
        }

        tableDeviations[tableName].deviatingObjects[field] = objectProperties;
    };
}

function printResults(tableDeviations, config_number, IDs){
    for (let table in tableDeviations){
        console.log('\n@@@@', table);
        //Print deviating records
        const deviatingTable = tableDeviations[table];
        for (let field in deviatingTable.deviatingFields){
            console.log('------', deviatingTable.deviatingFields[field]);
						if(show_details){// Query databse for specific values if needed
							print_details(table, deviatingTable.deviatingFields[field])	
						}
						
        }

        //Print deviation objects
        if (deviatingTable.deviatingObjects){
            for (let fieldObject in deviatingTable.deviatingObjects){
                const objectProperties = deviatingTable.deviatingObjects[fieldObject];
                if (objectProperties.missing.length === 0 && objectProperties.added.length === 0 && objectProperties.modified.length === 0)
                    return;

                console.log('\n##### ', fieldObject, ' ###########\n')
                if (objectProperties.missing.length > 0) {
                    console.log('@@Missing@@@', objectProperties.missing.length, ' / sourcelist: ', objectProperties.sourceLength);
                    console.log(objectProperties.missing.join('\n'));
                }
                if (objectProperties.added.length > 0){
                    console.log('\n@@Added@@@', objectProperties.added.length, ' / targetlist: ', objectProperties.targetLength);
                    console.log(objectProperties.added.join('\n'));
                }

                if (objectProperties.modified.length > 0){
                    console.log('\n@@Modified@@@', objectProperties.modified.length);
                    console.log(objectProperties.modified.join('\n'));
                }
            }
        }
    }
}

function readFromTable(table, id,  callback){
    db.serialize(function() {
        db.all("SELECT * FROM " + table + " where configuration_id=" + id, function(err, allRows) {
            if(err != null){
                console.log(err);
                callback(err);
            }

            callback(allRows);
        });
    });
}

//Extract fieldnames from FPObject
function getObjectProperties(FPObject){
    const keys = [];
    for (let field in FPObject){ keys.push(field);}
    return keys;
}

//Console function works async ..
// Wrap it up when all tables are processed
function finalize(){
    tableCounter++;
    if (tableCounter === closeCounter){
        //Print Results
        printResults(tableDeviations);
        //Close DB connection
        db.close();
        console.log('Database connection closed');
    }
}

function print_details(table, dev){
	query_data(make_query(table, dev, source_configId));
	query_data(make_query(table, dev, target_configId));
}

function query_data(query){
	db.get(query,(err,row) =>
	{
		if(err){
			return console.err(err.message);
		}
		return row ? console.log(row) : console.log("Field not identified in the database")
	});
	
}	


function make_query(table, dev, id){
	return "SELECT " + dev + " From " + table + " where configuration_id = "+id;
}

module.exports.compareRecord = compareRecord;