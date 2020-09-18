import axios from 'axios';
import { validateOrderId } from './validations.js';

const ACCOUNT_NAME = 'hiringcoders8';
const ENVIRONMENT = 'vtexcommercestable';
const HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    "X-VTEX-API-AppKey": "vtexappkey-hiringcoders8-QQLYJQ",
    "X-VTEX-API-AppToken": "PHTDSYHQRAHFDPPXAQRKNXIRBZKBMYSZNTGMZWXXHTHMGALEIWGVUJHRYBBSOGDSIISKICXDSUCUQVKBOGTQSXFDLOOYVEJBPOEYIBVFYCCAGNACRZEHMNAKDOYTOZIO"
}

//Gets ALL orders from user
export async function getOrdersByEmail(email) {
    const baseUrl = `https://${ACCOUNT_NAME}.${ENVIRONMENT}.com.br`;
    const now = new Date();
    const queryUrl =  `${baseUrl}/api/oms/pvt/orders?q=${email}&f_creationDate=creationDate:[2016-01-01T02:00:00.000Z TO ${now.toISOString()}]`
    
    const options = {
        headers: HEADERS,
    }

    const result = await axios.get(queryUrl, options);
    return result.data;
}

export default async function getMostRecentOrderByEmail(email) {
    const orders = await getOrdersByEmail(email);
    
    if(!orders || !orders.list)
        return -1;

    const lista = (orders.list.length > 0) ? orders.list : [];

    const mostRecent = lista.reduce((acc, order) => {
        return (acc !== 0) ? (new Date(acc.creationDate) < new Date(order.creationDate)) ? acc = order : acc : acc = order;        
    },0);

    return mostRecent;

}

export async function getOrderDetailsByOrderId(orderId) {
    const baseUrl = `https://${ACCOUNT_NAME}.${ENVIRONMENT}.com.br`;
    const queryUrl =  `${baseUrl}/api/oms/pvt/orders/${orderId}`

    const options = {
        headers: HEADERS,
    }

    const result = await axios.get(queryUrl, options);
    return result.data;
}

export async function getNameByEmail(email) {
    const baseUrl = `https://${ACCOUNT_NAME}.${ENVIRONMENT}.com.br`;
    const queryUrl =  `${baseUrl}/api/dataentities/CL/search?_fields=firstName&_where=email%20%3D%20${email}&_keyword=String%20to%20search&_sort=firstName%20AS`
    
    const options = {
        headers: HEADERS,
    }

    const result = await axios.get(queryUrl, options);
    return result.data;
} 

async function main() {
    let emailErrado = 'alvaroraposo@yahoo.com.br';
    let emailCerto = 'alvaroraposo@gmail.com';
    let orderId = '1061712315074-01'

    // let orders = await getOrders(email);
    // let ordersList = orders.data.list;
    // console.log(orders.data);
    const order = await getNameByEmail(emailErrado);
    console.log("order", order);

    //Imprime as datas no formato americano mm/dd/yyyy (1º pedido)
    // let shippingEstimateDate = new Date(ordersList[0].ShippingEstimatedDate);
    // let shippingEstimatedDateMax = new Date(ordersList[0].ShippingEstimatedDateMax);
    // let creationDate = new Date(ordersList[0].creationDate)
    // console.log("Data esperada de entrega: " + shippingEstimateDate.toLocaleDateString('en'));
    // console.log("Prazo máximo para entrega: " + shippingEstimatedDateMax.toLocaleDateString('en'));
    // console.log('Pedido realizado em: ' + creationDate.toLocaleDateString('en'));

    //Tem jeito mais eficiente de fazer
    // console.log('Listing orders details:\n');
    // ordersList.forEach(async item => {
    //     let orderDetail = await getOrderDetails(item.orderId);
    //     console.log(orderDetail.data);
    // })
}

main()