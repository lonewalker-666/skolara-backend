import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { env } from "../config/env";
import axios from "axios";
import HttpError from "../utils/httpError";

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = env;

const client = new SNSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export async function sendSms(mobile: string, message: string) {
  try {
    {
      /*      SNS integration     */
    }

    // const phoneNumber = `+91${mobile}`;
    // const params: any = {
    //   PhoneNumber: phoneNumber,
    //   Message: message,
    //   MessageAttributes: {
    //     "AWS.SNS.SMS.SMSType": {
    //       DataType: "String",
    //       StringValue: "Transactional",
    //     },
    //   },
    // };

    // if (process.env.AWS_SNS_SENDER_ID) {
    //   params.MessageAttributes["AWS.SNS.SMS.SenderID"] = {
    //     DataType: "String",
    //     StringValue: process.env.AWS_SNS_SENDER_ID,
    //   };
    // }

    // const response = await client.send(new PublishCommand(params));
    // return response; // contains MessageId, useful for debugging

    {
      /*      My Dreams integration     */
    }

    const url = "http://app.mydreamstechnology.in/vb/apikey.php";

    const response = await axios.get(url, {
      params: {
        apikey: "4FClQdEklXUr3h1L",
        senderid: "MYDTEH",
        number: mobile,
        message: message,
      },
    });
    if (response.data.status !== "Success") {
      console.log("SNS sendSms response:", response);
      throw new HttpError("Send SMS failed", 400);
    }
    return response;
  } catch (err) {
    console.error("SNS sendSms error:", err);
    throw err;
  }
}
