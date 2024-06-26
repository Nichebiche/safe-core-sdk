import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, {
  PredictedSafeProps,
  SafeTransactionOptionalProps,
  standardizeSafeTransactionData,
  SafeContractImplementationType as SafeContract
} from '@safe-global/protocol-kit/index'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getERC20Mintable, getSafeWithOwners } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

const BASE_OPTIONS: SafeTransactionOptionalProps = {
  baseGas: '111',
  gasPrice: '222',
  gasToken: '0x333',
  refundReceiver: '0x444',
  nonce: 555,
  safeTxGas: '666'
}

describe('Transactions creation', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const provider = getEip1193Provider()
    const predictedSafe: PredictedSafeProps = {
      safeAccountConfig: {
        owners: [accounts[0].address],
        threshold: 1
      },
      safeDeploymentConfig: {
        safeVersion: safeVersionDeployed
      }
    }
    return {
      erc20Mintable: await getERC20Mintable(),
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      chainId,
      contractNetworks,
      predictedSafe,
      provider
    }
  })

  describe('standardizeSafeTransactionData', async () => {
    itif(safeVersionDeployed >= '1.3.0')(
      'should return a transaction with safeTxGas=0 if safeVersion>=1.3.0 and gasPrice=0',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const txDataPartial: SafeTransactionDataPartial = {
          to: account2.address,
          value: '0',
          data: '0x'
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(safeTxData.safeTxGas).to.be.eq('0')
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return a transaction with estimated safeTxGas if safeVersion>=1.3.0 and gasPrice>0',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const txDataPartial: SafeTransactionDataPartial = {
          to: account2.address,
          value: '0',
          data: '0x',
          gasPrice: BASE_OPTIONS.gasPrice
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(BigInt(safeTxData.safeTxGas) > 0).to.be.true
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return a transaction with defined safeTxGas if safeVersion>=1.3.0',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const safeTxGas = BASE_OPTIONS.safeTxGas
        const txDataPartial: SafeTransactionDataPartial = {
          to: account2.address,
          value: '0',
          data: '0x',
          safeTxGas
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(safeTxData.safeTxGas).to.be.eq(safeTxGas)
      }
    )

    itif(safeVersionDeployed < '1.3.0')(
      'should return a transaction with estimated safeTxGas if safeVersion<1.3.0',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const txDataPartial: SafeTransactionDataPartial = {
          to: account2.address,
          value: '0',
          data: '0x'
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(BigInt(safeTxData.safeTxGas) > 0).to.be.true
      }
    )

    itif(safeVersionDeployed < '1.3.0')(
      'should return a transaction with defined safeTxGas of 0 if safeVersion<1.3.0',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const safeTxGas = '0'
        const txDataPartial: SafeTransactionDataPartial = {
          to: account2.address,
          value: '0',
          data: '0x',
          safeTxGas
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(safeTxData.safeTxGas).to.be.eq(safeTxGas)
      }
    )

    itif(safeVersionDeployed < '1.3.0')(
      'should return a transaction with defined safeTxGas if safeVersion<1.3.0',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const safeTxGas = BASE_OPTIONS.safeTxGas
        const txDataPartial: SafeTransactionDataPartial = {
          to: account2.address,
          value: '0',
          data: '0x',
          safeTxGas
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(safeTxData.safeTxGas).to.be.eq(safeTxGas)
      }
    )
  })

  describe('createTransaction', async () => {
    it('should create a single transaction with gasPrice=0', async () => {
      const { predictedSafe, accounts, contractNetworks, provider } = await setupTests()
      const [, account2] = accounts
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const options = {
        ...BASE_OPTIONS,
        gasPrice: '0'
      }
      const tx = safeSdk.createTransaction({ transactions: [safeTransactionData], options })
      chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
    })

    it('should create a single transaction with gasPrice=0', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({
        transactions: [safeTransactionData],
        options: BASE_OPTIONS
      })
      chai.expect(tx.data.to).to.be.eq(account2.address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
      chai.expect(tx.data.baseGas).to.be.eq(BASE_OPTIONS.baseGas)
      chai.expect(tx.data.gasPrice).to.be.eq(BASE_OPTIONS.gasPrice)
      chai.expect(tx.data.gasToken).to.be.eq(BASE_OPTIONS.gasToken)
      chai.expect(tx.data.refundReceiver).to.be.eq(BASE_OPTIONS.refundReceiver)
      chai.expect(tx.data.nonce).to.be.eq(BASE_OPTIONS.nonce)
      chai.expect(tx.data.safeTxGas).to.be.eq(BASE_OPTIONS.safeTxGas)
    })

    it('should create a single transaction with gasPrice>0', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({
        transactions: [safeTransactionData],
        options: BASE_OPTIONS
      })
      chai.expect(tx.data.to).to.be.eq(account2.address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
      chai.expect(tx.data.baseGas).to.be.eq(BASE_OPTIONS.baseGas)
      chai.expect(tx.data.gasPrice).to.be.eq(BASE_OPTIONS.gasPrice)
      chai.expect(tx.data.gasToken).to.be.eq(BASE_OPTIONS.gasToken)
      chai.expect(tx.data.refundReceiver).to.be.eq(BASE_OPTIONS.refundReceiver)
      chai.expect(tx.data.nonce).to.be.eq(BASE_OPTIONS.nonce)
      chai.expect(tx.data.safeTxGas).to.be.eq(BASE_OPTIONS.safeTxGas)
    })

    it('should create a single transaction when passing a transaction array with length=1', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      chai.expect(tx.data.to).to.be.eq(account2.address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
    })

    it('should create a single transaction when passing a transaction array with length=1 and options', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const options: SafeTransactionOptionalProps = BASE_OPTIONS
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData], options })
      chai.expect(tx.data.to).to.be.eq(account2.address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
      chai.expect(tx.data.baseGas).to.be.eq(BASE_OPTIONS.baseGas)
      chai.expect(tx.data.gasPrice).to.be.eq(BASE_OPTIONS.gasPrice)
      chai.expect(tx.data.gasToken).to.be.eq(BASE_OPTIONS.gasToken)
      chai.expect(tx.data.refundReceiver).to.be.eq(BASE_OPTIONS.refundReceiver)
      chai.expect(tx.data.nonce).to.be.eq(BASE_OPTIONS.nonce)
      chai.expect(tx.data.safeTxGas).to.be.eq(BASE_OPTIONS.safeTxGas)
    })

    it('should fail when creating a MultiSend transaction passing a transaction array with length=0', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createTransaction({ transactions: [] })
      await chai.expect(tx).to.be.rejectedWith('Invalid empty array of transactions')
    })

    it('should create a MultiSend transaction', async () => {
      const { accounts, contractNetworks, erc20Mintable, chainId, provider } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const transactions = [
        {
          to: await erc20Mintable.getAddress(),
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '1100000000000000000' // 1.1 ERC20
          ])
        },
        {
          to: await erc20Mintable.getAddress(),
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '100000000000000000' // 0.1 ERC20
          ])
        }
      ]
      const multiSendTx = await safeSdk.createTransaction({ transactions })
      chai
        .expect(multiSendTx.data.to)
        .to.be.eq(contractNetworks[chainId.toString()].multiSendAddress)
    })

    it('should create a MultiSend transaction with options', async () => {
      const { accounts, contractNetworks, erc20Mintable, chainId, provider } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const options = BASE_OPTIONS

      const transactions = [
        {
          to: await erc20Mintable.getAddress(),
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '1100000000000000000' // 1.1 ERC20
          ])
        },
        {
          to: await erc20Mintable.getAddress(),
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '100000000000000000' // 0.1 ERC20
          ])
        }
      ]
      const multiSendTx = await safeSdk.createTransaction({ transactions, options })
      chai
        .expect(multiSendTx.data.to)
        .to.be.eq(contractNetworks[chainId.toString()].multiSendAddress)
      chai.expect(multiSendTx.data.value).to.be.eq('0')
      chai.expect(multiSendTx.data.baseGas).to.be.eq(BASE_OPTIONS.baseGas)
      chai.expect(multiSendTx.data.gasPrice).to.be.eq(BASE_OPTIONS.gasPrice)
      chai.expect(multiSendTx.data.gasToken).to.be.eq(BASE_OPTIONS.gasToken)
      chai.expect(multiSendTx.data.refundReceiver).to.be.eq(BASE_OPTIONS.refundReceiver)
      chai.expect(multiSendTx.data.nonce).to.be.eq(BASE_OPTIONS.nonce)
      chai.expect(multiSendTx.data.safeTxGas).to.be.eq(BASE_OPTIONS.safeTxGas)
    })

    itif(safeVersionDeployed < '1.3.0')(
      'should fail to create a transaction if the Safe with version <v1.3.0 is using predicted config',
      async () => {
        const { safe, predictedSafe, contractNetworks, provider } = await setupTests()
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const safeTransactionData = {
          to: safeAddress,
          value: '0',
          data: '0x'
        }
        const tx = safeSdk.createTransaction({ transactions: [safeTransactionData] })
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
          )
      }
    )
  })
})
