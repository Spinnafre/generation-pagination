import {Request} from './request.js'

const request=new Request()
async function scheduler(){
    const requests=[
        {url:'https://www.mercadobitcoin.net/api/BTC/ticker/'},
        {url:'https://www.NAO_EXISTE.net'},
        {url:'https://www.mercadobitcoin.net/api/BTC/orderbook/'}
    ]
    .map(url=>{
        return {
            ...url,
            method:'get',
            timeout:2000
        }
    })
    .map(data=>request.makeRequest(data))

    const results= await Promise.allSettled(requests)

    const rejecteds=[]
    const resolves=[]

    for(const {status,value,reason} of results){
        if(status=='rejected'){
            rejecteds.push(reason)
            continue
        }

        resolves.push(value)

    }


    console.log({
        resolves,
        rejecteds
    })
}

scheduler()