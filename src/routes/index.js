const dotenv = require('dotenv');
const express = require('express');
const {ethers} = require("ethers");

dotenv.config();

const router = express.Router();

//router.get('/', (req, res) => {
//  res.send({ message: 'Hello world' });
//});

///
const whitelist = require("../../whitelist.json").whitelist;
const isUserWhitelisted = (buyer) => {
	//return whitelist.includes(buyer)
	return whitelist.find(element => {
  		return element.toLowerCase() === buyer.toLowerCase();
	}) != undefined;
}

const validateInput = () =>{
  if (
    (process.env.SIGNER_PK 
    && process.env.CHAIN_ID
    && process.env.COLLECTION_NAME
    && process.env.CONTRACT_ADDRESS)
    )
      return true;
    return false;
}
///


let NONCE = Math.floor(Math.random()*123456789)
router.get('/sig/:buyer', async (req, res) => {

  if (!validateInput())
    return res.send({ message : "Internal error" });
  let buyer;
  try{
    buyer = ethers.utils.getAddress(req.params.buyer);
    if (!isUserWhitelisted(buyer))
      return res.send({ message : "Not whitelisted" });
  }
  catch (e){
    return res.send({ message : "Invalid address" });
  }
  const whitelistSigner = new ethers.Wallet(process.env.SIGNER_PK);
  const nonce = NONCE++;
  const signedQty = 3; // 3 per minter 
  const signature = await whitelistSigner._signTypedData(
    {
      name: process.env.COLLECTION_NAME,
      version: '1',
      chainId: process.env.CHAIN_ID,
      verifyingContract: process.env.CONTRACT_ADDRESS,
    },
    {
      Whitelist: [
        { name: "buyer", type: "address" },
        { name: "signedQty", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    },
    {
      buyer,
      signedQty,
      nonce,
    }
  );
  return res.send({ signature, nonce, signedQty});
});

module.exports = router;
