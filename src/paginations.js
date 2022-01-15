import { Request } from "./request.js"

const DEFAULT_OPTIONS = {
    MAX_RETRIES:4,
    THRESHOLD:200,
    // Tempo de espera para fazer a requisição novamente caso
    // apareça problemas
    RETRY_TIMEOUT:1000,
    // Tempo máximo de cada requisição deve ter, caso ultrasse o tempo
    // limite irá lançar uma erro
    MAX_REQUEST_TIMEOUT:1000
}

class Pagination {
    constructor() {
        this.request = new Request()
        this.max_retries = DEFAULT_OPTIONS.MAX_RETRIES
        this.threshold = DEFAULT_OPTIONS.THRESHOLD
        this.retry_timeout = DEFAULT_OPTIONS.RETRY_TIMEOUT
        this.max_request_timeout = DEFAULT_OPTIONS.MAX_REQUEST_TIMEOUT
    }

    async handleRequest({ url, page,retry=1 }) {
        try {
            const full_url = `${url}?tid=${page}`
            const request_data =await this.request.makeRequest({
                url: full_url,
                method: 'get',
                timeout: this.max_request_timeout
            })
            return request_data
        } catch (error) {
            // Se ultrapassou o máximo de tentativas
            if(retry == this.max_retries){
                console.error('[ERROR] - max retries reached!')
                throw error
            }
            console.log(`[${retry}] an error: [${error.message}] has occurred :( , trying again in ${this.retry_timeout} )`)

            //Espera x ms para depois realizar os outros passos
            await Pagination.sleep(this.retry_timeout)

            return this.handleRequest({url,page,retry:retry+=1})
        }
    }
    // Retornar cada dado de acordo com a demanda, ou seja, de acordo com o pedido irá
    // retornar um novo valor através de uma página
    async *getPagination({url,page}) {
        const results= await this.handleRequest({url,page})
        const lasId= results[results.length - 1]?.tid??0

        if(lasId == 0) return

        yield results

        // Esperar x ms para depois fazer a requisição novamente,
        // evitar sobrecarregar a API de requisições
        await Pagination.sleep(this.max_request_timeout)

        yield* this.getPagination({url,page:lasId})
    }

    // Usado para evitar fazer múltiplas requisições ao mesmo tempo
    static async sleep(time){
        return new Promise((resolve,reject)=>{
            setTimeout(()=>resolve(),time)
        })
    }

}

export{Pagination}

