import fs from 'fs'

const targetUrl = "https://www.ubereats.com/api/getPastOrdersV1"

const lookUps = {
  serviceFee: ['Frais de service', 'eats.mp.charges.basket_dependent_fee_intl'],
  taxServiceFee: ['Taxe sur les frais de service', 'eats.mp.charges.basket_dependent_fee_intl.excl.tax'],
  deliveryFee: ['Frais de livraison', 'eats.mp.charges.delivery_fee'],
  taxDeliveryFee: ['Taxe sur les frais de livraison', 'eats.mp.charges.delivery_fee.tax'],
  subTotal: ['Sous-total', 'eats_fare.subtotal'],
  total: ['Total', 'eats_fare.total'],
  // + [Offre spéciale, eats.item_discount.promotion_total]
}

export const parserFactory = () => { 
  const retrieveResponsesContent = (entries: any[]) => {
    return entries.reduce((acc: any, entry: any) => {
      if (!entry?.request?.url.startsWith(targetUrl)) {
        return acc
      }

      try {
        const responses = JSON.parse(entry.response.content.text)
        acc.push(responses)
      } catch (error) {
        if (entry.response.content.encoding === 'base64') {
          const response = JSON.parse(Buffer.from(entry.response.content.text, 'base64').toString('utf8'))
          acc.push(response)
          return
        } 
        
        console.error('retrieve response content failure', { error })
      } finally {
        return acc
      }
    }, [] as any)
  }

  const intersect = (a: any[], b: any[]) => a.filter(value => b.includes(value));

  const retrieveOrders = (responses: any[]) => {
    return responses.reduce((acc: any, response: any) => {
      const { data: { ordersMap } = { ordersMap: null} } = response

      if (!ordersMap) { 
        console.error('could not retrieve ordersMap')
      }

      const orders = Object.values(ordersMap).reduce((acc: any[], order: any) => {
        const { 
            baseEaterOrder: { isCancelled, isCompleted, shoppingCart } = { isCancelled: false, isCompleted: false, shoppingCart: undefined },
            fareInfo: { checkoutInfo } = { checkoutInfo: [] },
            storeInfo: { title }
          } = order

        if (isCancelled || !isCompleted) {
          // console.log('order cancelled or not completed', { isCancelled, isCompleted })
          return acc
        }


        const { stateChangeTime: date } = isCompleted
        // const totalPrice = shoppingCart.items.reduce((acc: any, item: any) => acc + item.price, 0)

        const detailedPrice = checkoutInfo.reduce((acc: any, item: any) => {
          const { label, rawValue, key } = item

          Object.keys(lookUps).forEach((k: string) => {
            if (intersect(lookUps[k as keyof typeof lookUps], [label, key]).length > 0) {
              acc[k] = rawValue
            }

          })
          
          return acc
        }, {
          serviceFee: 0,
          taxServiceFee: 0,
          deliveryFee: 0,
          taxDeliveryFee: 0,
          subTotal: 0,
          total: 0
        })

        const totalServiceFee = detailedPrice.serviceFee + detailedPrice.taxServiceFee
        const totalDeliveryFee = detailedPrice.deliveryFee + detailedPrice.taxDeliveryFee
        const realPrice = detailedPrice.total

        acc.push({ title, price: realPrice, totalDeliveryFee, totalServiceFee, date })
        return acc
      }, [] as any[])

      if (orders && orders.length > 0) {
        acc.push(...orders)
      }
      return acc
    }, [] as any)
  }

  return {
    parse: (data: any) => retrieveOrders(retrieveResponsesContent(data.log.entries))
  }
}
