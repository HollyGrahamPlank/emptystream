import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult, Context } from 'aws-lambda'

async function handlerValidation(event: APIGatewayProxyEvent, context: Context) {
    // ...do nothing
    return {};
}

export const handler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    const { } = handlerValidation(event, context);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Hello World!"
        })
    };
}