// 클레이튼 네트워크와 소통하기 위한 라이브러리 불러오기
import Caver from "caver-js"

// 스피너를 사용하기 위한 라이브러리 불러오기
import {Spinner} from "spin.js"

// 환경 설정 상수
const config = {
    rpcURL: "https://api.baobab.klaytn.net:8651"
}

// caver instance
const cav = new Caver(config.rpcURL)

// 컨트랙트(계약) 인스턴스
const agContract = new cav.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS)

const App = {
    
    auth: {
        accessType: "keystore",
        keystore: "",
        password: ""
    },
    
    start: async function () {
        // const tokenAddress = '0xcac25b35f3708acac59c505228597b0b664bc640'
        // const tokenSymbol = 'SBPT'
        // const tokenDecimals = 8
        // const tokenImage = 'https://www.playgrounds.co.kr/images/logo.png'
    
        // klaytn.sendAsync(
        //     {
        //         method: 'wallet_watchAsset',
        //         params: {
        //             type: 'ERC20', // Initially only supports ERC20, but eventually more!
        //             options: {
        //                 address: tokenAddress, // The address that the token is at.
        //                 symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
        //                 decimals: tokenDecimals, // The number of decimals in the token
        //                 image: tokenImage // A string url of the token logo
        //             }
        //         },
        //         id: Math.round(Math.random() * 100000)
        //     },
        //     (err, added) => {
        //         if (added) {
        //             console.log('Thanks for your interest!')
        //         } else {
        //             console.log('Your loss!')
        //         }
        //     }
        // )
    
        const sender = caver.klay.accounts.wallet[0];
        console.log(sender)
        
        // 세션 스토리지에서 월렛 인스턴스를 가져온다
        const walletFromSession = sessionStorage.getItem('walletInstance')
        
        // 변수에 월렛 인스턴스가 잘 담겼는지 확인한다
        if (walletFromSession) {
            try {
                // cav wallet 에 월렛 인스턴스를 등록한다
                cav.klay.accounts.wallet.add(JSON.parse(walletFromSession))
                
                // UI 를 변경한다
                this.changeUI(JSON.parse(walletFromSession))
            } catch (e) {
                // 변수에 담긴 월렛 인스턴스가 올바르지 않다면 세션에서 삭제한다
                sessionStorage.removeItem('walletInstance')
            }
        }
    },
    
    // keystore 파일이 유효한지 검사
    handleImport: async function () {
        console.log("handleImport 호출")
        const input = document.querySelector("#keystore")
        const fileReader = new FileReader();
        fileReader.readAsText(input.files[0]);
        fileReader.onload = (event) => {
            try {
                if (!this.checkValidKeystore(fileReader.result)) {
                    $('#message').text("유효하지 않은 keystore 파일 입니다.")
                    console.log("Pass1")
                    return
                }
                
                this.auth.keystore = fileReader.result
                $('#message').text("keystore 통과! 비밀번호를 입력하세요.")
                console.log(this.auth.keystore)
                document.querySelector("#input-password").focus()
            } catch (event) {
                $('#message').text("유효하지 않은 keystore 파일입니다.")
                return
            }
        }
    },
    
    handlePassword: async function () {
        this.auth.password = document.querySelector("#input-password").value
    },
    
    handleLogin: async function () {
        // accessType 이 keystore 인지 확인한다
        if (this.auth.accessType === 'keystore') {
            try {
                // keystore 파일과 비밀번호로 비밀키를 얻는다
                const privateKey = cav.klay.accounts.decrypt(this.auth.keystore, this.auth.password).privateKey

                // 지갑 연동 함수를 호출
                this.integrateWallet(privateKey)
            } catch (e) {
                $('#message').text('비밀번호가 일치하지 않습니다.')
            }
        }
    
        
    },
    
    handleLogout: async function () {
        // 이 함수를 통해서 cav wallet 을 비우고, 세션 스토리지에서도 wallet 인스턴스를 제거한다
        this.removeWallet()
        
        // 페이지를 새로 고침한다
        location.reload()
    },
    
    generateNumbers: async function () {
        const num1 = Math.floor(Math.random() * 50 + 10)
        const num2 = Math.floor(Math.random() * 50 + 10)
        const answer = num1 + num2
        sessionStorage.setItem("answer", answer)
        
        // 시작 부분을 감춘다
        $('#start').hide()
        
        // 생성한 숫자를 span 에 채운다
        $('#num1').text(num1)
        $('#num2').text(num2)
        
        // 질문 부분을 보이게 한다
        $('#question').show()
        
        // 답 입력 칸으로 포커스를 옮긴다
        document.querySelector("#answer").focus()
        
        // 타이머를 호출한다
        this.showTimer()
    },
    
    deposit: async function () {
        // 스피너 호출
        const spinner = this.showSpinner()
        
        // console.log("deposit function called")
        // 로그인된 계정이 owner 계정인지 확인 한다
        // 로그인된 계정 불러오기
        const walletInstance = this.getWallet()
        
        // 계정이 존재한다면
        if (walletInstance) {
            const oAddress = await this.callOwner()
            const lAddress = walletInstance.address
            if (!this.checkOwner(oAddress, lAddress)) return
            else {
                const amount = $('#amount').val();
                console.log("amount = ", amount)
                if (amount) {
                    // 누가
                    agContract.methods.deposit()
                        .send({
                            from: walletInstance.address,
                            gas: '250000',
                            value: cav.utils.toPeb(amount, "KLAY")
                        })
                        .then(response => {
                            console.log(`(#${response.blockNumber})`, response)
                            console.log(`txHash: ${response.transactionHash}`)
                            alert(amount + " KLAY 를 컨트랙에 송금했습니다")
                            spinner.stop()
                            location.reload()
                        })
                        .catch(error => {
                            alert(error.message)
                        })
                }
                return
            }
        }
    },
    
    callOwner: async function () {
        // 우리가 만든 ag계약에서 owner 변수를 불러온다
        return await agContract.methods.owner().call()
    },
    
    callContractBalance: async function () {
        // 컨트랙 인스턴스에 접근해서 밸런스를 불러온다
        return await agContract.methods.getBalance().call()
    },
    
    getWallet: function () {
        // 현재 계정 정보를 가져온다
        if (cav.klay.accounts.wallet.length) {
            return cav.klay.accounts.wallet[0]
        }
    },
    
    getWalletBalance: async function (walletInstance) {
        return cav.utils.fromPeb(await cav.rpc.klay.getBalance(walletInstance.address), "KLAY")
    },
    
    /**
     * keystore 파일이 유효한지 확인 하는 함수
     * keystore 파일을 열어서 필수적으로 있어야 하는 값들이 무엇인지 확인하고, 그 값들을 사용하여 체크함수를 만듬
     */
    checkValidKeystore: function (keystore) {
        const parsedKeystore = JSON.parse(keystore) // object 로 변환
        const isValidKeystore = parsedKeystore.version &&
            parsedKeystore.id &&
            parsedKeystore.address &&
            parsedKeystore.keyring
        
        return isValidKeystore
    },
    
    checkOwner: function (oAddress, lAddress) {
        return oAddress.toLowerCase() === lAddress.toLowerCase()
    },
    
    /**
     * 지갑 연동 함수
     * @param privateKey
     */
    integrateWallet: function (privateKey) {
        // privateKey 로 계정 정보를 조회하여 walletInstance 에 담는다
        const walletInstance = cav.klay.accounts.privateKeyToAccount(privateKey)
        
        // cav wallet 에 walletInstance 를 추가하면
        // 앞으로 트랜잭션을 생성할때 쉽게 내 계정정보를 불러와서 사용할 수 있게 된다
        cav.klay.accounts.wallet.add(walletInstance)
        
        // 세션에 월렛 인스턴스를 저장한다
        // 세션 스토리지를 사용하는 이유는 계정의 로그인 상태를 유지하기 위함이다
        sessionStorage.setItem('walletInstance', JSON.stringify(walletInstance))
        
        // UI 를 변경하는 함수를 호출한다
        this.changeUI(walletInstance)
    },
    
    /**
     * 전역 변수를 초기화 시키는 함수
     */
    reset: function () {
        this.auth = {
            keystore: '',
            password: ''
        }
    },
    
    /**
     * UI 변경 함수
     * @param walletInstance
     */
    changeUI: async function (walletInstance) {
        // 먼저 모달을 닫는다
        $('#loginModal').modal('hide')
        
        // 로그인 버튼을 감춘다
        $('#login').hide()
        
        // 로그아웃 버튼을 드러낸다
        $('#logout').show()
        
        // 시작 버튼을 드러낸다
        $('#game').show()
        
        // 내 계정 주소가 보이게 한다
        $('#address').append('<br>' + '<p>' + '내 계정 주소: ' + walletInstance.address + '</p>')
        
        // 지갑 잔액을 보이게 한다
        $('#addressBalance').append('<br>' + '<p>' + '지갑 잔액: ' + await this.getWalletBalance(walletInstance) + ' KLAY' + '</p>')
        
        // 콘트랙 잔액을 보이게 한다
        $('#contractBalance').append('<br>' + '<p>' + '이벤트 잔액: ' + cav.utils.fromPeb(await this.callContractBalance(), "KLAY") + ' KLAY' + '</p>')
        
        const oAddress = await this.callOwner()
        // console.log("owner address = ", oAddress)
        
        const lAddress = walletInstance.address
        // console.log("walletInstance address = ", lAddress)
        // owner 계정인 경우 owner div 가 보이게 한다
        
        if (this.checkOwner(oAddress, lAddress)) {
            $('#owner').show()
        }
    },
    
    removeWallet: function () {
        // cav wallet 지우기
        cav.klay.accounts.wallet.clear()
        
        // 세션 스토리지 지우기
        sessionStorage.removeItem('walletInstance')
        
        // 초기화 함수 호출
        this.reset()
    },
    
    showTimer: function () {
        // 시간을 3초로 설정
        let seconds = 3
        // 타이머 영역의 시간을 표시한다
        $('#timer').text(seconds)
        
        // setInterval 함수로 1초 간격으로 내용을 반복 실행한다
        const interval = setInterval(() => {
            // 타이머 영역의 시간을 변경한다
            $('#timer').text(--seconds)
            // 시간이 0이되면 초기화 한다
            if (seconds <= 0) {
                $('#timer').text('')
                $('#answer').val('')
                $('#question').hide()
                $('#start').show()
                clearInterval(interval)
            }
        }, 3000)
    },
    
    showSpinner: function () {
        const target = document.getElementById("spin");
        return new Spinner(opts).spin(target)
    },
    
    submitAnswer: async function () {
        // 세션에서 정답을 가져온다
        const answer = sessionStorage.getItem('answer')
        
        // 사용자가 입력한 정답을 가져 온다
        let inputAnswer = $('#answer').val()
        
        // 정답이 맞는지 확인하고 틀렸을 경우 얼럿과 함께 함수 종료
        if (answer !== inputAnswer) {
            alert(`땡! 틀렸습니다. 정답 = ${answer}, 입력된 값 = ${inputAnswer}`)
            return
        }
        
        if (confirm("정답 입니다. 0.1 KLAY 받기")) {
            // 컨트랙 잔액 불러오기
            const contractBalance = await this.callContractBalance()
            
            // 컨트랙 잔액이 0.1 이상인지 확인하기
            if (contractBalance >= 0.1) this.receiveKlay()
            else alert("죄송합니다. 컨트랙의 KLAY가 모두 소모 되었습니다")
        }
    },
    
    receiveKlay: function () {
        // 스피너를 동작 시킨다
        let spinner = this.showSpinner()
        
        // 현재 로그인한 계정의 인스턴스를 가져온다
        const walletInstance = this.getWallet()
        
        // 계정 인스턴스를 찾기 못하면 함수를 종료한다
        if (!walletInstance) return
        
        // transfer 계약을 호출한다
        agContract.methods.transfer(cav.utils.toPeb("0.1", "KLAY")).send({
            from: walletInstance.address,
            gas: "250000"
        }).then(receipt => {
            console.log("transfer result (receipt) => ", receipt)
            // 성공
            if (receipt.status) {
                // 스피너를 멈춘다
                spinner.stop()
                
                // 알림을 보여준다
                alert("0.1 KLAY 가 " + walletInstance.address + " 계정으로 지급되었습니다.")
                
                // 트랜잭션 html 영역을 지운다
                $('#transaction').html("")
                
                // 트랜잭션 html 영역에 scope 링크를 붙인다
                $('#transaction').append(`<p><a href="https://baobab.scope.klaytn.com/tx/${receipt.transactionHash}" target="_blank">
                    클레이튼 scope 에서 트랜잭션 확인</a></p>`
                )
    
                return agContract.methods.getBalance().call()
                    .then((balance) => {
                        $('#contractBalance').html("")
                        $('#contractBalance').append(`<p>이벤트 잔액: ${cav.utils.fromPeb(balance, "KLAY")} KLAY</p>`)
                    })
            }
        })
    }
};

window.App = App;

window.addEventListener("load", function () {
    App.start();
});

// spinner 환경 설정
var opts = {
    lines: 10, // The number of lines to draw
    length: 30, // The length of each line
    width: 17, // The line thickness
    radius: 45, // The radius of the inner circle
    scale: 1, // Scales overall size of the spinner
    corners: 1, // Corner roundness (0..1)
    color: '#5bc0de', // CSS color or array of colors
    fadeColor: 'transparent', // CSS color or array of colors
    speed: 1, // Rounds per second
    rotate: 0, // The rotation offset
    animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
    direction: 1, // 1: clockwise, -1: counterclockwise
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    className: 'spinner', // The CSS class to assign to the spinner
    top: '50%', // Top position relative to parent
    left: '50%', // Left position relative to parent
    shadow: '0 0 1px transparent', // Box-shadow for the lines
    position: 'absolute' // Element positioning
};