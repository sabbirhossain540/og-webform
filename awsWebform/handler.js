const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, UpdateCommand, DeleteCommand, GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "ap-northeast-3" });
const ddb = DynamoDBDocumentClient.from(client);
const crosObj = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE"
    };

module.exports.saveOrUpdate = async (event) => {
  try {
    const body = typeof event.body === "string"
      ? JSON.parse(event.body)
      : event.body;

    const appUrl = "https://ogusutest.s3.us-east-1.amazonaws.com/index.html";

    const corsHeaders = crosObj;
    console.log(body.id);
    if (body.id) {
      const params = {
      TableName: "WebFormData",
      Key: { id: body.id },
      UpdateExpression: `
        SET 
          title = :title,
          apiKey = :apiKey,
          description = :description,
          kintoneAppId = :kintoneAppId,
          directory = :directory,
          #fields = :fields,
          updatedAt = :updatedAt
      `,
      ExpressionAttributeNames: {
        "#fields": "fields"
      },
      ExpressionAttributeValues: {
        ":title": body.title,
        ":apiKey": body.apiKey,
        ":description": body.description,
        ":kintoneAppId": body.kintoneAppId,
        ":directory": body.directory,
        ":fields": body.fields,
        ":updatedAt": new Date().toISOString()
      },
      ReturnValues: "ALL_NEW"
    };


      const result = await ddb.send(new UpdateCommand(params));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Data updated successfully",
          data: result.Attributes
        })
      };
    }

    // SAVE
    const params = {
      TableName: "WebFormData",
      Item: {
        id: randomUUID(),
        title: body.title,
        apiKey: body.apiKey,
        appUrl: appUrl,
        kintoneAppId: body.kintoneAppId,
        description: body.description,
        directory: body.directory,
        fields: body.fields,
        createdAt: new Date().toISOString()
      }
    };

    await ddb.send(new PutCommand(params));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Data saved successfully" })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: crosObj,
      body: JSON.stringify({ error: err.message })
    };
  }
};


module.exports.getByKintoneAppId = async (event) => {
  try {
    const kintoneAppId = event.pathParameters?.kintoneAppId;
    const corsHeaders = crosObj;

    if (!kintoneAppId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "kintoneAppId is required" })
      };
    }

    const params = {
      TableName: "WebFormData",
      IndexName: "kintoneAppId-index",
      KeyConditionExpression: "kintoneAppId = :appId",
      ExpressionAttributeValues: {
        ":appId": Number(kintoneAppId)
      }
    };

    const result = await ddb.send(new QueryCommand(params));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "No items found" })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result.Items)
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: corsHeaders,
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
      ConditionExpression: "attribute_exists(id)"
    };

    await ddb.send(new DeleteCommand(params));

    return {
      statusCode: 200,
      headers: crosObj,
      body: JSON.stringify({ message: "Data deleted successfully" })
    };

  } catch (err) {
    console.error(err);

    if (err.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        headers: crosObj,
        body: JSON.stringify({ error: "Item not found" })
      };
    }

    return {
      statusCode: 500,
      headers: crosObj,
      body: JSON.stringify({ error: err.message })
    };
  }
};


