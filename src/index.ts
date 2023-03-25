import fs from 'fs'
import { parserFactory } from './parser'
import { stater } from './stats'
import { Order } from './models'

const [_, __, filePath = "./www.ubereats.com.har", sD = '2000', tpRange = '3'] = process.argv
const startDate = parseInt(sD, 10)
const topRange = parseInt(tpRange, 10)

const fContent = JSON.parse(fs.readFileSync(filePath).toString())

const parser = parserFactory()

const orders: Order[] = parser.parse(fContent).filter((order: Order) => {
  const orderDate = new Date(order.date);
  return orderDate.getFullYear() >= startDate;
})

console.log(stater().log(orders, topRange))

fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2))

