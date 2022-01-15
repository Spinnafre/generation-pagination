import https from 'https'

class Request{

    errorTimeout(reject,url){
        return ()=>reject(new Error(`[ERROR -API ] => Timeout at [${url}] !!!!!`))
        
    }

    raceTimeoutDelay(url,delay){
        return new Promise((resolve,reject)=>{
            // Error Timeout tem que retornar uma função para ser executada no timeout
            setTimeout(this.errorTimeout(reject,url),delay)
        })
    }

    async get(url){
        return new Promise((resolve,reject)=>{
            https.get(url,res=>{
                const items=[]
                res.on('data',data=>
                    items.push(data)
                )
                .on('end',()=>
                    resolve(JSON.parse(items.join('')))
                )
            })
            .on('error',reject)
        })
    }
    // Irá pegar a primeira promisse que for resolvida,
    //entre sucesso e errro
    makeRequest({url,method,timeout}){
        return Promise.race([
            // API
            this[method](url),
            // Promise error
            this.raceTimeoutDelay(url,timeout)
        ])
    }
}

export {Request}
