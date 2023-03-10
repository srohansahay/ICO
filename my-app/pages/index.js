import Head from 'next/head';
import { BigNumber, Contract, providers, utils } from 'ethers';
import { useRef, useEffect, useState } from 'react';
import Web3Modal from "web3modal";
import styles from '@/styles/Home.module.css';
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export default function Home(){

  const zero = BigNumber.from(0);

  const[walletConnected, setWalletConnected] = useState(false);
  const[tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const[balanceOfCryptoDevTokens,setBalanceOfCryptoDevTokens] = useState(zero);
  const[loading,setLoading]=useState(false);
  const[tokensMinted,setTokensMinted]=useState(zero);
  const[isOwner,setIsOwner] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(zero);
  
 const web3ModalRef = useRef();

 const getProviderOrSigner = async(needSigner=false) =>{

  const provider = await web3ModalRef.current.connect();
  const web3Provider = new providers.Web3Provider(provider);

  const {chainId} = await web3Provider.getNetwork();
  if(chainId !== 5){
    window.alert("Change network to Goerli");
    throw new Error("Change network to Goerli");
  }

  if(needSigner){
    const signer = web3Provider.getSigner();
    return signer;
  }

  return web3Provider;
 }

 const connectWallet = async() =>{
  try{
    await getProviderOrSigner(false);
    setWalletConnected(true);

  }catch(e){
    console.error(e);
  }

 }

 const getTokensToBeClaimed = async() =>{

  try {

  const provider = await getProviderOrSigner();
  const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,provider);
  const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,provider);
  const signer = await getProviderOrSigner(true);
  const address = await signer.getAddress();
  const balance = await nftContract.balanceOf(address);

  if(balance===zero){
    setTokensToBeClaimed(zero);
  }else{
    var amount =0;

    for(var i=0;i<balance;i++){
      const tokenId = await nftContract.tokenOfOwnerByIndex(address,i);
      const claimed = await tokenContract.tokenIdsClaimed(tokenId);
      if(!claimed){
        amount++;
      }
    }
    setTokensToBeClaimed(BigNumber.from(amount));
  }
    
  } catch (e) {
    console.error(e);
    setTokensToBeClaimed(zero);
  }

 }

 const getBalanceOfCryptoDevTokens = async()=>{
  try {
    const provider = await getProviderOrSigner(false);
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,provider);
    const signer = await getProviderOrSigner(true);
    const address = await signer.getAddress();
    const balance = await tokenContract.balanceOf(address);
    setBalanceOfCryptoDevTokens(balance);
  } catch (e) {
    console.error(e);
    setBalanceOfCryptoDevTokens(zero);
  }
 }

 const mintCryptoDevToken = async(amount) => {
  try {
    const signer = await getProviderOrSigner(true);
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,signer);
    const value = amount * 0.001;
    const tsx = await tokenContract.mint(amount, {value: utils.parseEther(value.toString())});
    setLoading(true);
    await tsx.wait();
    setLoading(false);
    window.alert("Successfully minted a Crypto Dev token");
    await getBalanceOfCryptoDevTokens();
    await getTokensToBeClaimed();
    await getTotalTokensMinted();
    
  } catch (e) {console.error(e); }
 };

 const claimCryptoDevTokens = async() => {
  try {
    const signer = await getProviderOrSigner(true);
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,signer);
    const tsx = await tokenContract.claim();
    setLoading(true);
    await tsx.wait();
    setLoading(false);
    window.alert("Sucessfully claimed Crypto Dev Tokens");
    await getBalanceOfCryptoDevTokens();
    await getTokensToBeClaimed();
    await getTotalTokensMinted();
  } catch (e) {console.error(e);}
 }

 const getTotalTokensMinted = async() => {
  try {
    const provider = await getProviderOrSigner(false);
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,provider);
    const _tokensMinted = await tokenContract.totalSupply();
    setTokensMinted(_tokensMinted);
  } catch (error) {
    console.error(error);}
 }

 const getOwner = async() => {  
  try {
  const provider = await getProviderOrSigner();
  const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,provider);
  const _owner = await tokenContract.owner();

  const signer = await getProviderOrSigner(true);
  const address = await signer.getAddress();

  if(_owner.toLowerCase()===address.toLowerCase()){
    setIsOwner(true);
  }
  } catch (error) { console.error(error.message);}
 }

 const withdrawCoins = async() => {
  try {
    const signer = await getProviderOrSigner(true);
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,signer);
    const tsx = await tokenContract.withdraw();
    setLoading(true);
    await tsx.wait();
    setLoading(false);
    await getOwner();
  } catch (e) {console.error(e);
  window.alert(e.reason);}
 }

 useEffect(() => {
  // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
  if (!walletConnected) {
    // Assign the Web3Modal class to the reference object by setting it's `current` value
    // The `current` value is persisted throughout as long as this page is open
    web3ModalRef.current = new Web3Modal({
      network: "goerli",
      providerOptions: {},
      disableInjectedProvider: false,
    });
    connectWallet();
    getTotalTokensMinted();
    getBalanceOfCryptoDevTokens();
    getTokensToBeClaimed();
    getOwner();
  }
}, [walletConnected]);

const renderButton = () => {
  // If we are currently waiting for something, return a loading button
  if (loading) {
    return (
      <div>
        <button className={styles.button}>Loading...</button>
      </div>
    );
  }
  // If tokens to be claimed are greater than 0, Return a claim button
  if (tokensToBeClaimed > 0) {
    return (
      <div>
        <div className={styles.description}>
          {tokensToBeClaimed * 10} Tokens can be claimed!
        </div>
        <button className={styles.button} onClick={claimCryptoDevTokens}>
          Claim Tokens
        </button>
      </div>
    );
  }
  // If user doesn't have any tokens to claim, show the mint button
  return (
    <div style={{ display: "flex-col" }}>
      <div>
        <input
          type="number"
          placeholder="Amount of Tokens"
          // BigNumber.from converts the `e.target.value` to a BigNumber
          onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
          className={styles.input}
        />
      </div>

      <button
        className={styles.button}
        disabled={!(tokenAmount > 0)}
        onClick={() => mintCryptoDevToken(tokenAmount)}
      >
        Mint Tokens
      </button>
    </div>
  );
};

return (
  <div>
    <Head>
      <title>Crypto Devs</title>
      <meta name="description" content="ICO-Dapp" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
        <div className={styles.description}>
          You can claim or mint Crypto Dev tokens here
        </div>
        {walletConnected ? (
          <div>
            <div className={styles.description}>
              {/* Format Ether helps us in converting a BigNumber to string */}
              You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto
              Dev Tokens
            </div>
            <div className={styles.description}>
              {/* Format Ether helps us in converting a BigNumber to string */}
              Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
            </div>
            {renderButton()}
            {/* Display additional withdraw button if connected wallet is owner */}
              {isOwner ? (
                <div>
                {loading ? <button className={styles.button}>Loading...</button>
                         : <button className={styles.button} onClick={withdrawCoins}>
                             Withdraw Coins
                           </button>
                }
                </div>
                ) : ("")
              }
          </div>
        ) : (
          <button onClick={connectWallet} className={styles.button}>
            Connect your wallet
          </button>
        )}
      </div>
      <div>
        <img className={styles.image} src="./0.svg" />
      </div>
    </div>

    <footer className={styles.footer}>
      Made with &#10084; by Crypto Devs
    </footer>
  </div>
);
}



