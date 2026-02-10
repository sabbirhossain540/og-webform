const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, UpdateCommand, DeleteCommand, GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const client = new DynamoDBClient({ region: "ap-northeast-3" });
const ddb = DynamoDBDocumentClient.from(client);

module.exports.saveOrUpdate = async (event) => {
  try {
    const body = typeof event.body === "string"
      ? JSON.parse(event.body)
      : event.body;

    // UPDATE
    if (body.id) {
      const params = {
        TableName: "WebFormData",
        Key: { id: body.id },
        UpdateExpression: `
          SET 
            #name = :name,
            email = :email,
            message = :message,
            essential = :essential,
            updatedAt = :updatedAt
        `,
        ExpressionAttributeNames: {
          "#name": "name"
        },
        ExpressionAttributeValues: {
          ":name": body.name,
          ":email": body.email,
          ":message": body.message,
          ":essential": body.essential,
          ":updatedAt": new Date().toISOString()
        },
        ReturnValues: "ALL_NEW"
      };

      const result = await ddb.send(new UpdateCommand(params));

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Data updated successfully ✅",
          data: result.Attributes
        })
      };
    }

    // SAVE
    const params = {
      TableName: "WebFormData",
      Item: {
        id: randomUUID(),
        name: body.name,
        email: body.email,
        message: body.message,
        essential: body.essential,
        createdAt: new Date().toISOString()
      }
    };

    await ddb.send(new PutCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data saved successfully ✅" })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

//For get single Item
module.exports.getSingleItem = async (event) => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "id is required" })
      };
    }

    const params = {
      TableName: "WebFormData",
      Key: { id }
    };

    const result = await ddb.send(new GetCommand(params));

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Item not found" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};


//For Dekete record
module.exports.deleteData = async (event) => {
  try {
    // id path param অথবা body থেকে নাও
    const id =
      event.pathParameters?.id ||
      (event.body && JSON.parse(event.body).id);

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "id is required for delete" })
      };
    }

    const params = {
      TableName: "WebFormData",
      Key: { id },
      ConditionExpression: "attribute_exists(id)" // না থাকলে error দেবে
    };

    await ddb.send(new DeleteCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data deleted successfully ✅" })
    };

  } catch (err) {
    console.error(err);

    // Item না থাকলে
    if (err.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Item not found" })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};


