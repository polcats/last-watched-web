var db_cred = require("./credentials.js");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const db_name = "last_watched";
const db_url = "mongodb+srv://" + db_cred.user + ":" + db_cred.pw + "@cluster0-vsehd.mongodb.net/test?retryWrites=true&w=majority";

async function queryItem(collection, query) {
    let db = await MongoClient.connect(db_url);
    let dbo = db.db(db_name);
    let item = await dbo
        .collection(collection)
        .find(query)
        .toArray();
    return item;
}

async function insertItem(collection, item) {
    let db = await MongoClient.connect(db_url);
    let dbo = db.db(db_name);

    await dbo.collection(collection).insertOne(item, function(err, res) {
        if (err) {
            console.log(err);
        }
        final_result = res;
        db.close();
    });
}

async function updateItem(collection, query, updatedItem) {
    let db = await MongoClient.connect(db_url);
    let dbo = db.db(db_name);
    let updateSuccessful = await dbo.collection(collection).updateOne(query, updatedItem, function(err, res) {
        if (err) {
            console.log(err);
        }

        db.close();
        return true;
    });
    return updateSuccessful;
}

async function deleteItem(collection, query) {
    let db = await MongoClient.connect(db_url);
    let dbo = db.db(db_name);
    let deletionSuccessful = await dbo.collection(collection).deleteOne(query, function(err, res) {
        if (err) {
            console.log(err);
        }

        db.close();
        return true;
    });
    return deletionSuccessful;
}

async function checkItemExistence(collection, query) {
    let item = await queryItem(collection, query);
    return item;
}

async function createCollection(collection) {
    let db = await MongoClient.connect(db_url);
    let dbo = db.db(db_name);
    dbo.createCollection(collection, function(err, res) {
        if (err) {
            throw err;
        }
        console.log("Collection " + collection + " created!");
        db.close();
    });
}

async function clearCollection(collection) {
    let db = await MongoClient.connect(db_url);
    let dbo = db.db(db_name);
    let myquery = {};

    await dbo.collection(collection).deleteMany(myquery, function(err, obj) {
        if (err) throw err;
        console.log(obj.result.n + " document(s) deleted");
        db.close();
    });
}

module.exports.queryItem = queryItem;
module.exports.insertItem = insertItem;
module.exports.deleteItem = deleteItem;
module.exports.updateItem = updateItem;
module.exports.checkItemExistence = checkItemExistence;
module.exports.ObjectId = ObjectId;
