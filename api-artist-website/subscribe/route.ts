import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // return Response.json({ message: 'Hello World' },{status: 200});
  // return res.status(200).json({});
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({message: 'Email is required'}, { status: 422});
    }

    const MailchimpKey = process.env.MAILCHIMP_API_KEY;
    const MailchimpServer = process.env.MAILCHIMP_API_SERVER;
    const MailchimpAudience = process.env.MAILCHIMP_LIST_ID;

    // console.log(MailchimpKey,
    //   MailchimpServer,
    //   MailchimpAudience)
    //   console.log('env', process.env)
    if (!MailchimpKey || !MailchimpServer || !MailchimpAudience) {
      throw new Error('Missing Mailchimp environment variables');
    }

    const customUrl = `https://${MailchimpServer}.api.mailchimp.com/3.0/lists/${MailchimpAudience}/members`;
    // console.log('custom url:', customUrl)
    // console.log(`Basic ${Buffer.from(`anystring:${MailchimpKey}`).toString('base64')}`)
    const response = await fetch(customUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${MailchimpKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      // console.log(errorData)
      return Response.json({message: errorData.detail}, { status:response.status});
    }

    const received = await response.json();
    return NextResponse.json(received);
    // eslint-disable-next-line
  }  catch (error: any) {
    return Response.json({ message: error?.message || "Error desconocido" }, { status: 500 });
}}