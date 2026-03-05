const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, UpdateCommand, DeleteCommand, GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, CopyObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const client = new DynamoDBClient({ region: "ap-northeast-3" });
const ddb = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({ region: "ap-northeast-3" }); 

const crosObj = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE"
    };

async function websiteDirectoryManagement(data){

  const bucketName = "ogusu-webform"; // তোমার bucket নাম
  const sourceKey = "index.html"; // existing HTML file
  const directoryName = data.directory + "-" + data.kintoneAppId;

  console.log("Creating directory:", directoryName);

  // folder name validation (VERY IMPORTANT)
  // if (!/^[a-z0-9-]+$/.test(directoryName)) {
  //   throw new Error("Invalid directory name");
  // }

  const destinationKey = `${directoryName}/index.html`;

  try {

    await s3.send(new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destinationKey
    }));

    console.log("File copied successfully");

    return `https://ogusu-webform.s3.ap-northeast-3.amazonaws.com/${directoryName}/index.html`;

  } catch (error) {
    console.error("S3 error:", error);
    throw error;
  }
}

module.exports.saveOrUpdate = async (event) => {
  console.log(event);
  
  try {
    const body = typeof event.body === "string"
      ? JSON.parse(event.body)
      : event.body;


    

    const corsHeaders = crosObj;
    console.log(body);
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
          #fields = :fields,
          mainFieldProperties = :mainFieldProperties,
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
        ":fields": body.fields,
        ":mainFieldProperties": body.mainFieldProperties,
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
    //const appUrl = await websiteDirectoryManagement(body);
    // SAVE
    const params = {
      TableName: "WebFormData",
      Item: {
        id: randomUUID(),
        title: body.title,
        apiKey: body.apiKey,
        appUrl: await websiteDirectoryManagement(body),
        kintoneAppId: body.kintoneAppId,
        description: body.description,
        directory: body.directory,
        fields: body.fields,
        mainFieldProperties: body.mainFieldProperties,
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
async function directoryDelete(directoryName) {

  const bucketName = "ogusu-webform";

  try {
    const listResponse = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${directoryName}/`
      })
    );

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log("No files found in directory");
      return;
    }

    const objectsToDelete = listResponse.Contents.map(item => ({
      Key: item.Key
    }));

    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: objectsToDelete
        }
      })
    );

    console.log("Directory deleted successfully");

  } catch (error) {
    console.error("Directory delete error:", error);
    throw error;
  }
}

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

    const existingItem = await ddb.send(
      new GetCommand({
        TableName: "WebFormData",
        Key: { id }
      })
    );

    if (!existingItem.Item) {
      return {
        statusCode: 404,
        headers: crosObj,
        body: JSON.stringify({ error: "Item not found" })
      };
    }

    const directoryName =
      existingItem.Item.directory +
      "-" +
      existingItem.Item.kintoneAppId;

    await directoryDelete(directoryName);

    await ddb.send(
      new DeleteCommand({
        TableName: "WebFormData",
        Key: { id }
      })
    );

    return {
      statusCode: 200,
      headers: crosObj,
      body: JSON.stringify({ message: "Data and directory deleted successfully" })
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



