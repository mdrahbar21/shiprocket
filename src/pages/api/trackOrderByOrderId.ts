import type { NextApiRequest, NextApiResponse } from 'next';

async function getShiprocketToken(): Promise<string> {
  const loginUrl = 'https://apiv2.shiprocket.in/v1/external/auth/login';
  const loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to log in to Shiprocket');
  }

  const data = await loginResponse.json();
  return data.token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const {orderId}=req.query;

  let token = await getShiprocketToken(); 

  const trackOrder = async (token: string) => {
    const url = `https://apiv2.shiprocket.in/v1/external/courier/track?order_id=${orderId}`;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (response.status === 401) {  // If token is expired or invalid
          token = await getShiprocketToken(); 
          return await trackOrder(token); 
        }
        throw new Error(`Failed to fetch data from Shiprocket: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error:any) {
      throw new Error(`Fetch failed: ${error.message}`);
    }
  };

  try {
    const data = await trackOrder(token);
    return res.status(200).json(data);
  } catch (error:any) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve data', details: error.message });
  }
}
