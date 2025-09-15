import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { env } from "../config/env";

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = env;

const client = new SNSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export async function sendSms(mobile: string, message: string) {
  const phoneNumber = `+91${mobile}`; // default +91
  const params: any = {
    PhoneNumber: phoneNumber,
    Message: message,
    MessageAttributes: {
      "AWS.SNS.SMS.SMSType": {
        DataType: "String",
        StringValue: "Transactional",
      },
    },
  };
  if (process.env.AWS_SNS_SENDER_ID) {
    params.MessageAttributes["AWS.SNS.SMS.SenderID"] = {
      DataType: "String",
      StringValue: process.env.AWS_SNS_SENDER_ID,
    };
  }
  await client.send(new PublishCommand(params));
}
