import { describe, it } from "mocha";
import { createSandbox, spy } from "sinon";
import { Pagination } from "../src/paginations.js";
import assert from "assert";

describe("#Pagination tests", () => {
    let sandbox;

    before(() => {
        // Facilita em processos de restaurar, resetar... automaticamente
        // evitando ter que ficar resetando ou restaurando manualmente determinadas
        // funções do sinon
        sandbox = createSandbox(); 
    });

    afterEach(() => {
        sandbox.restore(); // Irá restaurar tudo
    });

    describe("#Pagination", () => {
        it("Should retry an request twice before throwing an exception and validate request params and flow", async () => {
            const expectedTimeout = 10;
            const maxRetries = 2;

            const errorMakeRequest = new Error("timeout");
            const pagination = new Pagination();

            pagination.max_retries = maxRetries;
            pagination.retry_timeout = expectedTimeout;
            pagination.max_request_timeout = expectedTimeout;

            const handleRequestArg = { url: "https://google.com", page: 0 };
            const makeRequestArg = {
                url: "https://google.com?tid=0",
                method: "get",
                timeout: 10,
            };

            sandbox.spy(pagination, "handleRequest");

            sandbox.stub(Pagination, "sleep").resolves();

            // Sempre que for chamar a makeRequest(), irá retornar uma promessa rejeitada com o error 'new Error('timeout')'
            sandbox.stub(pagination.request, "makeRequest").rejects(errorMakeRequest);

            // Espera que a função retorne uma promessa rejeitada com o erro 'timeout'
            await assert.rejects(
                pagination.handleRequest(handleRequestArg),
                errorMakeRequest
            );

            assert.strictEqual(pagination.handleRequest.callCount, maxRetries);

            //Testar se está chamando a função handleRequest incrementando o retry
            assert.deepStrictEqual(
                pagination.handleRequest.lastCall.firstArg.retry,
                maxRetries
            );

            //Testar os argumentos passado para a função handleRequest
            assert.deepStrictEqual(pagination.handleRequest.firstCall.firstArg, {
                url: "https://google.com",
                page: 0,
            });

            // Testar os argumentos passados para makeRequest
            assert.deepStrictEqual(
                pagination.request.makeRequest.firstCall.firstArg,
                makeRequestArg
            );
        });
        it("Should return data from request when succeeded", async () => {
            const pagination = new Pagination();
            const data = { message: "blablabla" };

            //Alterando a função makeRequest para retornar uma promisse já resolvida,
            //quando chamada, com o objeto {message:'blablabla'}
            sandbox.stub(pagination.request, "makeRequest").resolves(data);

            const results = await pagination.handleRequest({
                url: "https://google.com",
                page: 0,
            });
            assert.strictEqual(results, data);
        });

        it('sleep should be a Promise object and not return values',async()=>{
            const clock=sandbox.useFakeTimers()
            const timer=10000

            const pagination= Pagination.sleep(timer)

            // Faz com que todos os timers dentro desse intervalo de tempo sejam chamados imediatamente
            // evitando que se for passado algum tempo para o setTimeout, setInterval... maior do que o limite
            // estabelecido pelo o sinon (2000ms ou 2 segundos), o teste possa rodar normalmente pois irá rodar 
            // os timeouts imediatamanete desconsiderando o tempo estabelecido.
            clock.tick(10000) // roda todos os timeouts dentro da intervalo de tempo de 10000 ms, só que imediatamente

            assert.ok(pagination instanceof Promise)
            const result=await pagination
            assert.ok(result == undefined)
        })

        describe("#getPaginated", () => {
            const responseMock = [
                {
                    tid: 5705,
                    date: 1373123005,
                    type: "sell",
                    price: 196.52,
                    amount: 0.01,
                },
                {
                    tid: 5706,
                    date: 1373124523,
                    type: "buy",
                    price: 200,
                    amount: 0.3,
                },
            ];
            it("Should update request id on each request", async() => { 
                const pagination=new Pagination()

                sandbox.spy(pagination,'getPagination')

                sandbox.stub(Pagination, "sleep").resolves();
                // Irá criar retornos para cada chamada, (falsa iteração)
                //Ou seja, a medida em que for chamando irá retornar tal valor especificado
                //Sendo muito útil para iteração
                sandbox.stub(pagination,'handleRequest')
                //Chamar pela primeira vez irá retornar responseMock[0]
                .onCall(0).resolves([responseMock[0]])
                //Chamar pela segunda vez irá retornar responseMock[1]
                .onCall(1).resolves([responseMock[1]])
                //Chamar pela terceira vez irá retornar []
                .onCall(2).resolves([])

                // console.log(await pagination.handleRequest({url:'https://google.com',page:0}))
                // console.log(await pagination.handleRequest({url:'https://google.com',page:0}))
                const data={url:'https://google.com',page:0}

                const getPagination= pagination.getPagination(data)

                await getPagination.next() // [responseMock[0]]
                await getPagination.next() // [responseMock[1]]
                await getPagination.next() // [responseMock[0]]
                
                // console.log('PRIMEIRO - ',await getPagination.next())
                // console.log('SEGUNDO - ',await getPagination.next())
                // console.log('TERCEIRO - ',await getPagination.next())

                const secondCallExpected={
                    ...data,
                    page:responseMock[0].tid
                }

                const thirdCallExpected={
                    ...data,
                    page:responseMock[1].tid
                }

                await assert.deepStrictEqual(pagination.getPagination.firstCall.firstArg,data)
                await assert.deepStrictEqual(pagination.getPagination.secondCall.firstArg,secondCallExpected)
                await assert.deepStrictEqual(pagination.getPagination.thirdCall.firstArg,thirdCallExpected)

            });
            it("should stop requesting when request return an empty array", async () => { 
                const pagination=new Pagination()

                sandbox.stub(Pagination, "sleep").resolves();

                sandbox.stub(pagination,'handleRequest')
                .onCall(0).resolves([responseMock[0]])
                .onCall(1).resolves([responseMock[1]])
                .onCall(2).resolves([])

                const data={url:'https://google.com',page:0}
                const getPagination= pagination.getPagination(data)

                const firstIteration=await getPagination.next()
                const secondIteration=await getPagination.next()
                const thirdIteration=await getPagination.next()

                assert.deepStrictEqual(firstIteration.value,[responseMock[0]])
                assert.deepStrictEqual(secondIteration.value,[responseMock[1]])
                assert.strictEqual(thirdIteration.value,undefined)

                assert.ok(Pagination.sleep.called && Pagination.sleep.callCount==2)
            });
        });
    });
});
