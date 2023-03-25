import { Order } from './models'

const r = ['Pizza Hut', 'Burger King', 'McDonald', 'KFC']

export const stater = () => {
  const logPrice = (p: number) => `${p.toFixed(2)} €`

  function averageMonthlySpending(orders: Order[]): number {
    const monthlySpendings: Record<string, number[]> = {};
    for (const order of orders) {
      const month = order.date.substring(0, 7);
      if (!monthlySpendings[month]) {
        monthlySpendings[month] = [];
      }
      monthlySpendings[month].push(order.price);
    }
    const months = Object.keys(monthlySpendings);
    const totalSpending = months.reduce((acc, month) => {
      const monthlySum = monthlySpendings[month].reduce((sum, price) => sum + price, 0);
      return acc + monthlySum;
    }, 0);
    const averageSpending = totalSpending / months.length;
  
    return averageSpending;
  }

  return {
    log: (orders: Order[], topRange = 3) => {
      const ref = Object.entries(orders.reduce((acc, order) => {
        const rr = r.find(e => order.title.startsWith(e))
        if (rr) {
          if (acc[rr]) {
            acc[rr] += 1
            return acc
          }
          acc = { ...acc, [rr]: 1 }
          return acc
        }
        if (acc[order.title]) {
          acc[order.title] += 1
          return acc
        }
        acc = { ...acc, [order.title]: 1 }
        return acc
      }, {} as any)).sort((a: any, b: any) => b[1] - a[1]).slice(0, topRange).reduce((acc: any[], c: any) => { 
        const [title, count] = c
        acc.push({ title, count })
        return acc
      }, [])

      const dateEnd = orders.reduce((latest, order) => {
        const date = new Date(order.date);
        return date > latest ? date : latest;
      }, new Date(0)).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });;

      const dateStart = orders.reduce((earliest, order) => {
        const date = new Date(order.date);
        return date < earliest ? date : earliest;
      }, new Date()).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });;

      const avg = (orders.reduce((acc, order) => {
        return acc + order.price
      }, 0) / orders.length)
          
      const total = orders.reduce((acc, order) => {
        return acc + order.price
      }, 0)

      const totalDeliveryFee = orders.reduce((acc, order) => {
        return acc + order.totalDeliveryFee
      }, 0)

      const totalServiceFee = orders.reduce((acc, order) => {
        return acc + order.totalServiceFee
      }, 0)

      const totalFees = (totalDeliveryFee + totalServiceFee)

      const spentByYear = orders.reduce((acc: any, order) => {
        const year = order.date.substring(0, 4);
        acc[year] = (acc[year] || 0) + order.price;
        return acc;
      }, {});

      return `
         Uber-eats recap 📈🍕: 
          total dépense: ${logPrice(total)}
          total commande: ${orders.length}
          moyenne commande: ${logPrice(avg)}
          moyenne mois:  ${logPrice(averageMonthlySpending(orders))}
          total x année: ${Object.entries(spentByYear).map(([year, total]) => `\n\t\t- ${year}: ${logPrice(total as number)}`).join(', ') }
          top ${ref.length}:${ref.map((r: any) => `\n\t\t- ${r.title} (${r.count})`).join(', ')}\n
          date range: ${dateStart} - ${dateEnd}
          total service: ${logPrice(totalFees)}
          total frais: ${logPrice(totalServiceFee)}
          total livraison: ${logPrice(totalDeliveryFee)}
      `
    }
  }
}
