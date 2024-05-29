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

  let token = await getShiprocketToken(); 

  const fetchOrders = async (token: string) => {
    const url = 'https://apiv2.shiprocket.in/v1/external/orders';
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
          return await fetchOrders(token); 
        }
        throw new Error(`Failed to fetch data from Shiprocket: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error:any) {
      throw new Error(`Fetch failed: ${error.message}`);
    }
  };

  try {
    const data = await fetchOrders(token);
    return res.status(200).json(data);
  } catch (error:any) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve data', details: error.message });
  }
}

    // const orders=output.data;

    // const filteredOrders = orders.map((order:any) => ({
    //     id: order.id,
    //     channel_id: order.channel_id,
    //     channel_name: order.channel_name,
    //     customer_name: `${order.customer_name}`,
    //     phone: order.customer_phone,
    //     email: order.customer_email,
    //     pickup_location: order.pickup_location,
    //     status: order.status,
    //     awb:order.last_mile_awb,
    //     awb_url:order.last_mile_awb_track_url,
    //     payment_method: order.payment_method,
    //     order_date: order.created_at,
    //     pickup_address: formatAddress(order.pickup_address_detail),
    //     billing_address: formatAddress(order.pickup_address_detail),
    //     pickup_boy:order.pickup_boy_contact_no,
    //     pickup_boy_name:order.pickup_boy_name,
    //     products: order.products.map((item:any) => ({
    //       id: item.id,
    //       name: item.name,
    //       product_id:item.product_id,
    //       status:item.status,
    //       availaibility:item.available,
    //       price:item.price,
    //       quantity: item.quantity
    //     })),
    //     shipments:order.shipments.map((item:any)=>({
    //         id:item.id,
    //         courier:item.courier,
    //         sr_courier_name:item.sr_courier_name,
    //         courier_id:item.courier_id,
    //         shipped_date:item.shipped_date,
    //         delivered_date:item.delivered_date,
    //         expected_delivery_date:item.pickup_scheduled_date,
    //         product_quantity:item.product_quantity,


    //         tracking_id:item.tracking_id,
    //         status:item.status,
    //         shipment_date:item.shipped_date
            

    //     }))
    // }));

    

