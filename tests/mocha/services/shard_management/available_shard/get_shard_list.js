"use strict";

// Load external packages
const Chai    = require('chai')
  , assert    = Chai.assert
;

const rootPrefix = "../../../../.."
  , DynamoDbObject = require(rootPrefix + "/index").DynamoDb
  , testConstants = require(rootPrefix + '/tests/mocha/services/constants')
  , Logger = require(rootPrefix + "/lib/logger/custom_console_logger")
  , logger = new Logger()
  , managedShardConst = require(rootPrefix + "/lib/global_constant/managed_shard")
  , availableShardConst = require(rootPrefix + "/lib/global_constant/available_shard")
  , helper = require(rootPrefix + "/tests/mocha/services/shard_management/helper")
;


const dynamoDbObject = new DynamoDbObject(testConstants.DYNAMODB_DEFAULT_CONFIGURATIONS)
  , shardManagementService = dynamoDbObject.shardManagement()
;



const createTestCasesForOptions = function (optionsDesc, options, toAssert) {
  optionsDesc = optionsDesc || "";
  options = options || {
    invalidShardType: false,
  };
  let entity_type = 'userBalances';

  it(optionsDesc, async function(){
    let shardType = availableShardConst.disabled;
    if (options.invalidShardType) {
      shardType = "test"
    }
    const response = await shardManagementService.getShardsByType({entity_type: entity_type, shard_type: shardType});

    logger.log("LOG", response);
    if (toAssert) {
      assert.isTrue(response.isSuccess(), "Success");
      assert.exists(response.data.data);
      assert.equal(response.data.data.length, 1);
    } else {
      assert.isTrue(response.isFailure(), "Failure");
    }
  });

};

describe('services/shard_management/available_shard/get_shards', function () {

  before(async function () {

    // delete table
    await dynamoDbObject.deleteTable({
      TableName: managedShardConst.getTableName()
    });

    await dynamoDbObject.deleteTable({
      TableName: availableShardConst.getTableName()
    });

    await shardManagementService.runShardMigration();

    let entity_type = 'userBalances';
    let schema = helper.createTableParamsFor("test");

    // delete table
    await dynamoDbObject.deleteTable({
      TableName: 'shard_00001_userBalances'
    });

    let shardName = "shard_00001_userBalances";
    await shardManagementService.addShard({shard_name: shardName, entity_type: entity_type, table_schema: schema});
  });

  createTestCasesForOptions("Get shard list adding happy case", {}, true);

  createTestCasesForOptions("Get shard list having invalid shard type", {
    invalidShardType: true
  }, false);
});