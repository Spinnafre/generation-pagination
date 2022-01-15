import { Pagination } from "./paginations.js"

(async()=>{
    const pagination=new Pagination()
    // Retorna um objeto iterável no qual a cada iteração irá gerar um novo valor
    const results= await pagination.getPagination({
        url:"https://www.mercadobitcoin.net/api/BTC/trades/",
        page:770e3
    })

    for await(const data of results){
        console.log(data)
    }
})()