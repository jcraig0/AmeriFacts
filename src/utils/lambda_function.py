import json
import boto3

def lambda_handler(event, context):
    body = json.loads(event['body'])

    return {
        'statusCode': 200,
        'body': json.dumps(
            boto3.client('dynamodb').scan(
                TableName=body['resolution'] + 's',
                ExpressionAttributeNames={'#N': 'Name'},
                ProjectionExpression='ID, #N, ' + body['attribute']
            ) if event['rawPath'] == '/attribute' else
            boto3.client('dynamodb').query(
                TableName=body['resolution'] + 's',
                ExpressionAttributeValues={':featureId': {'S': body['featureId']}},
                KeyConditionExpression='ID=:featureId'
            )
        )
    }
