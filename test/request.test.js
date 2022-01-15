import {describe,it} from 'mocha'
import assert from 'assert'
import {createSandbox,spy} from 'sinon'
import {Request} from '../src/request.js'

const functions={
    mapArray (array) {
        let arrayOfMappedItems = [];
        for (let item of array) {
            arrayOfMappedItems.push(item);
            
        }
        return arrayOfMappedItems;
    }
}


describe('Request helpers',()=>{
    const timeout=10
    let sandbox
    let request 
    const operation=spy(functions,'mapArray')

    before(()=>{
        request=new Request()
        sandbox=createSandbox()
    })
    afterEach(()=>{
        // Restaura os funções para o estado principal
        sandbox.restore()
        // Irá apagar os registros do spy, ou seja, depois de cada teste
        //  irá apagar os registros de chamadas de funções, argumentos passados para 
        // função, número de chamadas da função...
        // Evitando que caso usar o 'operation' em outro teste os históricos sejam comportilhados
        //  e acabe resultando em dados presentes em todos os testes sem serem apagados
        operation.resetHistory()
    })

    it(`Should throw a timeout error when the function has spent more time than ${timeout} ms`,async ()=>{
        // Substitui a função request.get() por uma nova função
        sandbox.stub(request,'get') // ou sandbox.stub(request,request.get.name)
        .callsFake((url)=>new Promise((resolve,reject)=>{
            console.log('Novo GET -> ',url)
            setTimeout(()=>resolve(),timeout+20)
        }))

        // Irá receber a promise Rejeitada
        const results= request.makeRequest({url:'https://testing.com',method:'get',timeout})
        // Espera que a promisse seja rejeitada
        await assert.rejects(results,{message:`[ERROR -API ] => Timeout at [https://testing.com] !!!!!`})

    })

    it(`Should return ok when promise time is ok`,async ()=>{
        sandbox.stub(request,'get')
        .callsFake((url)=>{
            return new Promise((resolve,reject)=>{
                setTimeout(resolve({message:'ok'}),timeout-5)
            })
        })

        const results=await request.makeRequest({url:'https://testing.com',method:'get',timeout})

        assert.deepStrictEqual(results,{message:'ok'})
    })

    it('Call operation',()=>{
        
        functions.mapArray([{ name: 'foo', role: 'author'}, { name: 'bar', role: 'owner'}])
        functions.mapArray([{ name: 'foo', role: 'author'}, { name: 'bar', role: 'owner'}])
        assert.equal(operation.callCount,2)

    })
    it('Call operation2',()=>{
        
        functions.mapArray([{ name: 'foo', role: 'author'}, { name: 'bar', role: 'owner'}])
        functions.mapArray([{ name: 'foo', role: 'author'}, { name: 'bar', role: 'owner'}])
        assert.equal(operation.callCount,2)

    })

})