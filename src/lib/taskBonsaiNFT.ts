import { ethers } from "ethers";
import ABI from "./taskBonsaiABI.json"; 

export const CONTRACT_ADDRESS = "0xCFF751a7C6AdF9Fa3b499bB65e322971C0d0cFa6";

export const getContract = (signer: ethers.Signer) => {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
};
